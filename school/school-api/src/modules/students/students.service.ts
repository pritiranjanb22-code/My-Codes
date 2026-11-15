import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentDto, UpdateStudentDto, BulkCreateStudentDto, StudentQueryDto, PromoteStudentDto, TransferStudentDto } from './dto/students.dto';
import { StudentStatus, Role } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStudentDto, schoolId: string) {
    const [existingAdmission, existingRoll, classExists, sectionExists] = await Promise.all([
      this.prisma.student.findFirst({ where: { admissionNo: dto.admissionNo, schoolId } }),
      this.prisma.student.findFirst({ where: { rollNumber: dto.rollNumber, classId: dto.classId, sectionId: dto.sectionId, schoolId } }),
      this.prisma.class.findFirst({ where: { id: dto.classId, schoolId } }),
      this.prisma.section.findFirst({ where: { id: dto.sectionId, schoolId, classId: dto.classId } }),
    ]);

    if (existingAdmission) throw new ConflictException('Admission number already exists');
    if (existingRoll) throw new ConflictException('Roll number already exists in this class/section');
    if (!classExists) throw new NotFoundException('Class not found');
    if (!sectionExists) throw new NotFoundException('Section not found');

    const student = await this.prisma.student.create({
      data: {
        ...dto,
        dateOfBirth: new Date(dto.dateOfBirth),
        admissionDate: new Date(dto.admissionDate),
        schoolId,
        classId: dto.classId,
        sectionId: dto.sectionId,
      },
      include: { class: true, section: true, parent: true },
    });

    await this.prisma.studentClassHistory.create({
      data: {
        studentId: student.id,
        classId: dto.classId,
        sectionId: dto.sectionId,
        academicYearId: classExists.academicYearId,
        schoolId,
        startDate: new Date(dto.admissionDate),
        isCurrent: true,
      },
    });

    return student;
  }

  async bulkCreate(dto: BulkCreateStudentDto, schoolId: string) {
    const results = { created: 0, failed: [] as any[] };

    for (const studentDto of dto.students) {
      try {
        await this.create(studentDto, schoolId);
        results.created++;
      } catch (error) {
        results.failed.push({ student: studentDto.admissionNo, error: error.message });
      }
    }

    return results;
  }

  async findAll(query: StudentQueryDto, schoolId: string) {
    const { search, classId, sectionId, status, page = 1, limit = 10 } = query;
    const where: any = { schoolId };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { admissionNo: { contains: search, mode: 'insensitive' } },
        { fatherName: { contains: search, mode: 'insensitive' } },
        { motherName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (classId) where.classId = classId;
    if (sectionId) where.sectionId = sectionId;
    if (status) where.status = status;

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: { class: true, section: true, parent: { include: { user: true } } },
        orderBy: [{ class: { level: 'asc' } }, { section: { name: 'asc' } }, { rollNumber: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.student.count({ where }),
    ]);

    return { data: students, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, schoolId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, schoolId },
      include: {
        class: true,
        section: true,
        parent: { include: { user: true } },
        attendances: { orderBy: { date: 'desc' }, take: 30 },
        marks: { include: { exam: true, subject: true }, orderBy: { createdAt: 'desc' } },
        classHistory: { include: { class: true, section: true, academicYear: true } },
      },
    });

    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async update(id: string, dto: UpdateStudentDto, schoolId: string) {
    await this.findOne(id, schoolId);

    if (dto.rollNumber) {
      const existing = await this.prisma.student.findFirst({
        where: { rollNumber: dto.rollNumber, classId: dto.classId, sectionId: dto.sectionId, schoolId, NOT: { id } },
      });
      if (existing) throw new ConflictException('Roll number already exists in this class/section');
    }

    return this.prisma.student.update({
      where: { id },
      data: dto,
      include: { class: true, section: true },
    });
  }

  async promote(id: string, dto: PromoteStudentDto, schoolId: string) {
    const student = await this.findOne(id, schoolId);
    const currentAcademicYear = await this.prisma.academicYear.findFirst({ where: { schoolId, status: 'CURRENT' } });
    const newAcademicYear = await this.prisma.academicYear.findFirst({ where: { schoolId, status: 'UPCOMING' } });

    if (!currentAcademicYear || !newAcademicYear) {
      throw new ConflictException('Current or upcoming academic year not configured');
    }

    const [newClass, newSection] = await Promise.all([
      this.prisma.class.findFirst({ where: { id: dto.newClassId, schoolId, academicYearId: newAcademicYear.id } }),
      this.prisma.section.findFirst({ where: { id: dto.newSectionId, schoolId, classId: dto.newClassId } }),
    ]);

    if (!newClass || !newSection) throw new NotFoundException('New class or section not found');

    const existingRoll = await this.prisma.student.findFirst({
      where: { rollNumber: dto.newRollNumber, classId: dto.newClassId, sectionId: dto.newSectionId, schoolId },
    });
    if (existingRoll) throw new ConflictException('Roll number already exists in new class/section');

    await this.prisma.studentClassHistory.updateMany({
      where: { studentId: id, isCurrent: true },
      data: { isCurrent: false, endDate: new Date() },
    });

    const updated = await this.prisma.student.update({
      where: { id },
      data: {
        classId: dto.newClassId,
        sectionId: dto.newSectionId,
        rollNumber: dto.newRollNumber,
      },
      include: { class: true, section: true },
    });

    await this.prisma.studentClassHistory.create({
      data: {
        studentId: id,
        classId: dto.newClassId,
        sectionId: dto.newSectionId,
        academicYearId: newAcademicYear.id,
        schoolId,
        startDate: new Date(),
        isCurrent: true,
      },
    });

    return updated;
  }

  async transfer(id: string, dto: TransferStudentDto, schoolId: string) {
    const student = await this.findOne(id, schoolId);

    await this.prisma.studentClassHistory.updateMany({
      where: { studentId: id, isCurrent: true },
      data: { isCurrent: false, endDate: new Date(dto.transferDate) },
    });

    return this.prisma.student.update({
      where: { id },
      data: {
        status: StudentStatus.TRANSFERRED,
        previousSchool: dto.newSchoolName,
      },
    });
  }

  async deactivate(id: string, schoolId: string) {
    await this.findOne(id, schoolId);
    return this.prisma.student.update({ where: { id }, data: { status: StudentStatus.DEACTIVATED } });
  }

  async getAttendanceReport(studentId: string, schoolId: string, academicYearId?: string, startDate?: Date, endDate?: Date) {
    const student = await this.findOne(studentId, schoolId);
    const year = academicYearId || (await this.prisma.academicYear.findFirst({ where: { schoolId, status: 'CURRENT' } }))?.id;

    const where: any = { studentId, schoolId };
    if (year) where.academicYearId = year;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const attendances = await this.prisma.attendance.findMany({ where, orderBy: { date: 'asc' } });

    const stats = attendances.reduce((acc, a) => {
      acc.total++;
      if (a.status === 'PRESENT') acc.present++;
      else if (a.status === 'ABSENT') acc.absent++;
      else if (a.status === 'LEAVE') acc.leave++;
      else if (a.status === 'LATE') acc.late++;
      else if (a.status === 'HALF_DAY') acc.halfDay++;
      return acc;
    }, { total: 0, present: 0, absent: 0, leave: 0, late: 0, halfDay: 0 });

    stats.percentage = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : '0';

    return { student, stats, attendances };
  }

  async getStats(schoolId: string) {
    const [total, active, byClass, byGender] = await Promise.all([
      this.prisma.student.count({ where: { schoolId } }),
      this.prisma.student.count({ where: { schoolId, status: StudentStatus.ACTIVE } }),
      this.prisma.student.groupBy({ by: ['classId'], where: { schoolId, status: StudentStatus.ACTIVE }, _count: true }),
      this.prisma.student.groupBy({ by: ['gender'], where: { schoolId, status: StudentStatus.ACTIVE }, _count: true }),
    ]);

    const classStats = await Promise.all(
      byClass.map(async (c) => {
        const cls = await this.prisma.class.findUnique({ where: { id: c.classId } });
        return { class: cls?.name, level: cls?.level, count: c._count };
      })
    );

    return { total, active, byClass: classStats, byGender: byGender.reduce((acc, g) => ({ ...acc, [g.gender]: g._count }), {}) };
  }
}