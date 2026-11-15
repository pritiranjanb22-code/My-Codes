import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMarkDto, BulkMarksDto, UpdateMarkDto, MarksQueryDto } from './dto/marks.dto';
import { Role } from '@prisma/client';

@Injectable()
export class MarksService {
  constructor(private prisma: PrismaService) {}

  async createMark(dto: CreateMarkDto, teacherId: string, schoolId: string) {
    const [student, exam, subject] = await Promise.all([
      this.prisma.student.findFirst({ where: { id: dto.studentId, schoolId } }),
      this.prisma.exam.findFirst({ where: { id: dto.examId, schoolId } }),
      this.prisma.subject.findFirst({ where: { id: dto.subjectId, schoolId } }),
    ]);

    if (!student) throw new NotFoundException('Student not found');
    if (!exam) throw new NotFoundException('Exam not found');
    if (!subject) throw new NotFoundException('Subject not found');

    if (dto.obtainedMarks > dto.maxMarks) throw new ConflictException('Obtained marks cannot exceed max marks');

    const examSubject = await this.prisma.examSubject.findUnique({ where: { examId_subjectId: { examId: dto.examId, subjectId: dto.subjectId } } });
    if (!examSubject) throw new ConflictException('Subject not part of this exam');
    if (dto.maxMarks !== examSubject.maxMarks) throw new ConflictException(`Max marks must be ${examSubject.maxMarks}`);

    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: { teacherId, subjectId: dto.subjectId, classId: student.classId, sectionId: student.sectionId },
    });
    if (!assignment) throw new ForbiddenException('Not authorized to enter marks for this subject/class');

    const existing = await this.prisma.mark.findUnique({ where: { studentId_examId_subjectId: { studentId: dto.studentId, examId: dto.examId, subjectId: dto.subjectId } } });
    if (existing) throw new ConflictException('Marks already entered for this student/exam/subject');

    const percentage = (dto.obtainedMarks / dto.maxMarks) * 100;
    const grade = this.calculateGrade(percentage);

    return this.prisma.mark.create({
      data: {
        ...dto,
        teacherId,
        schoolId,
        academicYearId: exam.academicYearId,
        grade,
        status: 'DRAFT',
      },
    });
  }

  async bulkCreateMarks(dto: BulkMarksDto, teacherId: string, schoolId: string) {
    const results = { created: 0, failed: [] as any[] };

    for (const markDto of dto.marks) {
      try {
        await this.createMark({ ...markDto, examId: dto.examId, subjectId: dto.subjectId }, teacherId, schoolId);
        results.created++;
      } catch (error) {
        results.failed.push({ studentId: markDto.studentId, error: error.message });
      }
    }

    return results;
  }

  async findAll(query: MarksQueryDto, schoolId: string, userId?: string, userRole?: Role) {
    const { studentId, examId, subjectId, teacherId, status, page = 1, limit = 50 } = query;
    const where: any = { schoolId };

    if (userRole === Role.TEACHER) {
      const teacher = await this.prisma.teacher.findFirst({ where: { userId, schoolId } });
      if (teacher) where.teacherId = teacher.id;
    } else if (userRole === Role.PARENT) {
      const parent = await this.prisma.parent.findFirst({ where: { userId, schoolId } });
      if (parent) where.studentId = { in: parent.children.map(c => c.studentId) };
    }

    if (studentId) where.studentId = studentId;
    if (examId) where.examId = examId;
    if (subjectId) where.subjectId = subjectId;
    if (teacherId) where.teacherId = teacherId;
    if (status) where.status = status;

    const [marks, total] = await Promise.all([
      this.prisma.mark.findMany({
        where,
        include: { student: { include: { user: true } }, exam: { include: { examType: true } }, subject: true, teacher: { include: { user: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.mark.count({ where }),
    ]);

    return { data: marks, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, schoolId: string) {
    const mark = await this.prisma.mark.findFirst({
      where: { id, schoolId },
      include: { student: { include: { class: true, section: true } }, exam: { include: { examType: true } }, subject: true, teacher: { include: { user: true } } },
    });
    if (!mark) throw new NotFoundException('Mark not found');
    return mark;
  }

  async update(id: string, dto: UpdateMarkDto, userId: string, userRole: Role, schoolId: string) {
    const mark = await this.findOne(id, schoolId);

    if (userRole === Role.TEACHER) {
      const teacher = await this.prisma.teacher.findFirst({ where: { userId, schoolId } });
      if (!teacher || mark.teacherId !== teacher.id) throw new ForbiddenException('Not authorized');
    }

    if (dto.obtainedMarks !== undefined && dto.obtainedMarks > mark.maxMarks) {
      throw new ConflictException('Obtained marks cannot exceed max marks');
    }

    const percentage = dto.obtainedMarks !== undefined ? (dto.obtainedMarks / mark.maxMarks) * 100 : (mark.obtainedMarks / mark.maxMarks) * 100;
    const grade = this.calculateGrade(percentage);

    return this.prisma.mark.update({
      where: { id },
      data: { ...dto, grade },
    });
  }

  async submitMarks(ids: string[], schoolId: string) {
    return this.prisma.mark.updateMany({
      where: { id: { in: ids }, schoolId, status: 'DRAFT' },
      data: { status: 'SUBMITTED' },
    });
  }

  async approveMarks(ids: string[], schoolId: string) {
    return this.prisma.mark.updateMany({
      where: { id: { in: ids }, schoolId, status: 'SUBMITTED' },
      data: { status: 'APPROVED' },
    });
  }

  async publishMarks(ids: string[], schoolId: string) {
    return this.prisma.mark.updateMany({
      where: { id: { in: ids }, schoolId, status: 'APPROVED' },
      data: { status: 'PUBLISHED' },
    });
  }

  async getStudentReport(studentId: string, examId: string, schoolId: string) {
    const marks = await this.prisma.mark.findMany({
      where: { studentId, examId, schoolId },
      include: { subject: true, exam: { include: { examType: true } } },
    });

    const totalObtained = marks.reduce((sum, m) => sum + m.obtainedMarks, 0);
    const totalMax = marks.reduce((sum, m) => sum + m.maxMarks, 0);
    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    const overallGrade = this.calculateGrade(percentage);

    return { marks, summary: { totalObtained, totalMax, percentage: percentage.toFixed(1), grade: overallGrade } };
  }

  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 33) return 'D';
    return 'F';
  }
}