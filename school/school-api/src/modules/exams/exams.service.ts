import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExamTypeDto, CreateExamDto, CreateExamSubjectDto, ExamQueryDto } from './dto/exams.dto';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async createExamType(dto: CreateExamTypeDto, schoolId: string) {
    const existing = await this.prisma.examType.findFirst({ where: { code: dto.code.toUpperCase(), schoolId } });
    if (existing) throw new ConflictException('Exam type code already exists');
    return this.prisma.examType.create({ data: { ...dto, code: dto.code.toUpperCase(), schoolId } });
  }

  async getExamTypes(schoolId: string) {
    return this.prisma.examType.findMany({ where: { schoolId, isActive: true }, orderBy: { name: 'asc' } });
  }

  async createExam(dto: CreateExamDto, schoolId: string) {
    const [examType, academicYear] = await Promise.all([
      this.prisma.examType.findFirst({ where: { id: dto.examTypeId, schoolId } }),
      this.prisma.academicYear.findFirst({ where: { id: dto.academicYearId, schoolId } }),
    ]);
    if (!examType) throw new NotFoundException('Exam type not found');
    if (!academicYear) throw new NotFoundException('Academic year not found');

    return this.prisma.exam.create({
      data: { ...dto, schoolId, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) },
      include: { examType: true, academicYear: true },
    });
  }

  async findAll(query: ExamQueryDto, schoolId: string) {
    const { examTypeId, academicYearId, page = 1, limit = 10 } = query;
    const where: any = { schoolId };
    if (examTypeId) where.examTypeId = examTypeId;
    if (academicYearId) where.academicYearId = academicYearId;

    const [exams, total] = await Promise.all([
      this.prisma.exam.findMany({
        where,
        include: { examType: true, academicYear: true, subjects: { include: { subject: true } } },
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.exam.count({ where }),
    ]);

    return { data: exams, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, schoolId: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id, schoolId },
      include: { examType: true, academicYear: true, subjects: { include: { subject: true } } },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  async addSubject(examId: string, dto: CreateExamSubjectDto, schoolId: string) {
    const exam = await this.findOne(examId, schoolId);
    const subject = await this.prisma.subject.findFirst({ where: { id: dto.subjectId, schoolId } });
    if (!subject) throw new NotFoundException('Subject not found');

    const existing = await this.prisma.examSubject.findUnique({ where: { examId_subjectId: { examId, subjectId: dto.subjectId } } });
    if (existing) throw new ConflictException('Subject already added to this exam');

    return this.prisma.examSubject.create({ data: { ...dto, examId, date: new Date(dto.date) } });
  }

  async updateStatus(id: string, status: string, schoolId: string) {
    await this.findOne(id, schoolId);
    return this.prisma.exam.update({ where: { id }, data: { status } });
  }

  async remove(id: string, schoolId: string) {
    await this.findOne(id, schoolId);
    return this.prisma.exam.delete({ where: { id } });
  }
}