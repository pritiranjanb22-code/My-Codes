import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BulkAttendanceDto, UpdateAttendanceDto, AttendanceQueryDto, OfflineSyncDto } from './dto/attendance.dto';
import { AttendanceStatus, Role } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async markAttendance(dto: BulkAttendanceDto, teacherId: string, schoolId: string) {
    const teacher = await this.prisma.teacher.findFirst({ where: { id: teacherId, schoolId } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const academicYear = await this.prisma.academicYear.findFirst({ where: { schoolId, status: 'CURRENT' } });
    if (!academicYear) throw new ConflictException('Current academic year not configured');

    const cls = await this.prisma.class.findFirst({ where: { id: dto.classId, schoolId, academicYearId: academicYear.id } });
    if (!cls) throw new NotFoundException('Class not found');

    const section = await this.prisma.section.findFirst({ where: { id: dto.sectionId, schoolId, classId: dto.classId } });
    if (!section) throw new NotFoundException('Section not found');

    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: { teacherId, classId: dto.classId, sectionId: dto.sectionId, academicYearId: academicYear.id },
    });
    if (!assignment) throw new ForbiddenException('Teacher not assigned to this class/section');

    const date = new Date(dto.date);
    date.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendance.findFirst({
      where: { classId: dto.classId, sectionId: dto.sectionId, date, period: dto.period, schoolId },
    });

    if (existing) throw new ConflictException('Attendance already submitted for this class/section/date/period');

    const students = await this.prisma.student.findMany({
      where: { classId: dto.classId, sectionId: dto.sectionId, schoolId, status: 'ACTIVE' },
      select: { id: true },
    });

    const studentIds = new Set(students.map(s => s.id));
    for (const a of dto.attendances) {
      if (!studentIds.has(a.studentId)) {
        throw new BadRequestException(`Student ${a.studentId} not in this class/section`);
      }
    }

    const attendances = await this.prisma.$transaction(
      dto.attendances.map(a =>
        this.prisma.attendance.create({
          data: {
            studentId: a.studentId,
            teacherId,
            schoolId,
            classId: dto.classId,
            sectionId: dto.sectionId,
            academicYearId: academicYear.id,
            date,
            period: dto.period || 'MORNING',
            status: a.status,
            remarks: a.remarks,
            syncedAt: new Date(),
          },
        })
      )
    );

    return { count: attendances.length, message: 'Attendance recorded successfully' };
  }

  async updateAttendance(id: string, dto: UpdateAttendanceDto, userId: string, userRole: Role, schoolId: string) {
    const attendance = await this.prisma.attendance.findFirst({ where: { id, schoolId } });
    if (!attendance) throw new NotFoundException('Attendance record not found');

    if (userRole === Role.TEACHER) {
      const teacher = await this.prisma.teacher.findFirst({ where: { userId, schoolId } });
      if (!teacher || attendance.teacherId !== teacher.id) {
        throw new ForbiddenException('Not authorized to modify this attendance');
      }
    }

    const updated = await this.prisma.attendance.update({
      where: { id },
      data: { status: dto.status, remarks: dto.remarks, updatedAt: new Date() },
    });

    return updated;
  }

  async findAll(query: AttendanceQueryDto, schoolId: string, userId?: string, userRole?: Role) {
    const { classId, sectionId, date, studentId, teacherId, startDate, endDate, page = 1, limit = 50 } = query;
    const where: any = { schoolId };

    if (userRole === Role.TEACHER) {
      const teacher = await this.prisma.teacher.findFirst({ where: { userId, schoolId } });
      if (teacher) where.teacherId = teacher.id;
    } else if (userRole === Role.PARENT) {
      const parent = await this.prisma.parent.findFirst({ where: { userId, schoolId } });
      if (parent) {
        const childIds = parent.children.map(c => c.studentId);
        where.studentId = { in: childIds };
      }
    }

    if (classId) where.classId = classId;
    if (sectionId) where.sectionId = sectionId;
    if (studentId) where.studentId = studentId;
    if (teacherId) where.teacherId = teacherId;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      where.date = d;
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [attendances, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        include: { student: { include: { user: true } }, teacher: { include: { user: true } }, class: true, section: true },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return { data: attendances, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getClassAttendance(classId: string, sectionId: string, date: string, schoolId: string) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const students = await this.prisma.student.findMany({
      where: { classId, sectionId, schoolId, status: 'ACTIVE' },
      include: { attendances: { where: { date: d, period: 'MORNING' } } },
      orderBy: { rollNumber: 'asc' },
    });

    return students.map(s => ({
      studentId: s.id,
      admissionNo: s.admissionNo,
      rollNumber: s.rollNumber,
      firstName: s.firstName,
      lastName: s.lastName,
      attendance: s.attendances[0] || null,
    }));
  }

  async getStudentReport(studentId: string, schoolId: string, academicYearId?: string, startDate?: Date, endDate?: Date) {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, schoolId } });
    if (!student) throw new NotFoundException('Student not found');

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

  async getClassReport(classId: string, sectionId: string, schoolId: string, academicYearId?: string, startDate?: Date, endDate?: Date) {
    const year = academicYearId || (await this.prisma.academicYear.findFirst({ where: { schoolId, status: 'CURRENT' } }))?.id;

    const students = await this.prisma.student.findMany({
      where: { classId, sectionId, schoolId, status: 'ACTIVE' },
      include: {
        attendances: {
          where: {
            ...(year && { academicYearId: year }),
            ...(startDate || endDate ? { date: { ...(startDate && { gte: startDate }), ...(endDate && { lte: endDate }) } } : {}),
          },
        },
      },
      orderBy: { rollNumber: 'asc' },
    });

    const report = students.map(s => {
      const attendances = s.attendances;
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
      return { student: { id: s.id, admissionNo: s.admissionNo, rollNumber: s.rollNumber, firstName: s.firstName, lastName: s.lastName }, stats };
    });

    return report;
  }

  async syncOffline(dto: OfflineSyncDto, teacherId: string, schoolId: string) {
    const results = { synced: 0, failed: [] as any[] };

    for (const record of dto.records) {
      try {
        await this.markAttendance(record, teacherId, schoolId);
        results.synced++;
      } catch (error) {
        results.failed.push({ record, error: error.message });
      }
    }

    return results;
  }

  async getTodayStats(schoolId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, present, absent, leave, late] = await Promise.all([
      this.prisma.attendance.count({ where: { schoolId, date: today } }),
      this.prisma.attendance.count({ where: { schoolId, date: today, status: 'PRESENT' } }),
      this.prisma.attendance.count({ where: { schoolId, date: today, status: 'ABSENT' } }),
      this.prisma.attendance.count({ where: { schoolId, date: today, status: 'LEAVE' } }),
      this.prisma.attendance.count({ where: { schoolId, date: today, status: 'LATE' } }),
    ]);

    return { total, present, absent, leave, late, percentage: total > 0 ? ((present / total) * 100).toFixed(1) : '0' };
  }
}