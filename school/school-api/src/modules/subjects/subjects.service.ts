import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubjectDto, UpdateSubjectDto, SubjectQueryDto } from './dto/subjects.dto';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSubjectDto, schoolId: string) {
    const existing = await this.prisma.subject.findFirst({ where: { code: dto.code.toUpperCase(), schoolId } });
    if (existing) throw new ConflictException('Subject code already exists');

    if (dto.classId) {
      const cls = await this.prisma.class.findFirst({ where: { id: dto.classId, schoolId } });
      if (!cls) throw new NotFoundException('Class not found');
    }

    if (dto.sectionId) {
      const section = await this.prisma.section.findFirst({ where: { id: dto.sectionId, schoolId } });
      if (!section) throw new NotFoundException('Section not found');
    }

    if (dto.teacherId) {
      const teacher = await this.prisma.teacher.findFirst({ where: { id: dto.teacherId, schoolId, status: 'ACTIVE' } });
      if (!teacher) throw new NotFoundException('Teacher not found or not active');
    }

    return this.prisma.subject.create({
      data: { ...dto, code: dto.code.toUpperCase(), schoolId },
      include: { class: true, section: true, teacher: { include: { user: true } } },
    });
  }

  async findAll(query: SubjectQueryDto, schoolId: string) {
    const { classId, sectionId, teacherId, page = 1, limit = 10 } = query;
    const where: any = { schoolId, isActive: true };
    if (classId) where.classId = classId;
    if (sectionId) where.sectionId = sectionId;
    if (teacherId) where.teacherId = teacherId;

    const [subjects, total] = await Promise.all([
      this.prisma.subject.findMany({
        where,
        include: { class: true, section: true, teacher: { include: { user: true } } },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.subject.count({ where }),
    ]);

    return { data: subjects, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, schoolId: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id, schoolId },
      include: { class: true, section: true, teacher: { include: { user: true } }, teacherAssignments: { include: { teacher: { include: { user: true } }, class: true, section: true } } },
    });

    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  async update(id: string, dto: UpdateSubjectDto, schoolId: string) {
    await this.findOne(id, schoolId);

    if (dto.code) {
      const existing = await this.prisma.subject.findFirst({ where: { code: dto.code.toUpperCase(), schoolId, NOT: { id } } });
      if (existing) throw new ConflictException('Subject code already exists');
    }

    if (dto.teacherId) {
      const teacher = await this.prisma.teacher.findFirst({ where: { id: dto.teacherId, schoolId, status: 'ACTIVE' } });
      if (!teacher) throw new NotFoundException('Teacher not found or not active');
    }

    return this.prisma.subject.update({
      where: { id },
      data: { ...dto, code: dto.code?.toUpperCase() },
      include: { class: true, section: true, teacher: { include: { user: true } } },
    });
  }

  async remove(id: string, schoolId: string) {
    await this.findOne(id, schoolId);
    return this.prisma.subject.update({ where: { id }, data: { isActive: false } });
  }
}