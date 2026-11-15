import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSectionDto, UpdateSectionDto, SectionQueryDto } from './dto/sections.dto';

@Injectable()
export class SectionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSectionDto, schoolId: string) {
    const cls = await this.prisma.class.findFirst({ where: { id: dto.classId, schoolId } });
    if (!cls) throw new NotFoundException('Class not found');

    const existing = await this.prisma.section.findFirst({ where: { name: dto.name, classId: dto.classId, schoolId } });
    if (existing) throw new ConflictException('Section already exists for this class');

    return this.prisma.section.create({
      data: { ...dto, schoolId },
      include: { class: true },
    });
  }

  async findAll(query: SectionQueryDto, schoolId: string) {
    const { classId, page = 1, limit = 10 } = query;
    const where: any = { schoolId };
    if (classId) where.classId = classId;

    const [sections, total] = await Promise.all([
      this.prisma.section.findMany({
        where,
        include: { class: true, _count: { select: { students: true } } },
        orderBy: [{ class: { level: 'asc' } }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.section.count({ where }),
    ]);

    return { data: sections, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, schoolId: string) {
    const section = await this.prisma.section.findFirst({
      where: { id, schoolId },
      include: { class: true, _count: { select: { students: true } }, subjects: true, teacherAssignments: { include: { teacher: { include: { user: true } }, subject: true } } },
    });

    if (!section) throw new NotFoundException('Section not found');
    return section;
  }

  async update(id: string, dto: UpdateSectionDto, schoolId: string) {
    await this.findOne(id, schoolId);

    if (dto.name) {
      const existing = await this.prisma.section.findFirst({ where: { name: dto.name, classId: (await this.findOne(id, schoolId)).classId, schoolId, NOT: { id } } });
      if (existing) throw new ConflictException('Section name already exists');
    }

    return this.prisma.section.update({ where: { id }, data: dto, include: { class: true } });
  }

  async remove(id: string, schoolId: string) {
    await this.findOne(id, schoolId);

    const studentCount = await this.prisma.student.count({ where: { sectionId: id, schoolId } });
    if (studentCount > 0) throw new ConflictException('Cannot delete section with enrolled students');

    return this.prisma.section.delete({ where: { id } });
  }
}