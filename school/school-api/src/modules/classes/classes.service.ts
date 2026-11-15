import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassDto, UpdateClassDto, ClassQueryDto } from './dto/classes.dto';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateClassDto, schoolId: string) {
    const academicYear = await this.prisma.academicYear.findFirst({ where: { id: dto.academicYearId, schoolId } });
    if (!academicYear) throw new NotFoundException('Academic year not found');

    const existing = await this.prisma.class.findFirst({ where: { name: dto.name, academicYearId: dto.academicYearId, schoolId } });
    if (existing) throw new ConflictException('Class already exists for this academic year');

    return this.prisma.class.create({
      data: { ...dto, schoolId },
      include: { academicYear: true, classTeacher: { include: { user: true } } },
    });
  }

  async findAll(query: ClassQueryDto, schoolId: string) {
    const { academicYearId, page = 1, limit = 10 } = query;
    const where: any = { schoolId };

    if (academicYearId) where.academicYearId = academicYearId;
    else {
      const currentYear = await this.prisma.academicYear.findFirst({ where: { schoolId, status: 'CURRENT' } });
      if (currentYear) where.academicYearId = currentYear.id;
    }

    const [classes, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        include: {
          academicYear: true,
          classTeacher: { include: { user: true } },
          _count: { select: { sections: true, students: true } },
        },
        orderBy: [{ level: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.class.count({ where }),
    ]);

    return { data: classes, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, schoolId: string) {
    const cls = await this.prisma.class.findFirst({
      where: { id, schoolId },
      include: {
        academicYear: true,
        classTeacher: { include: { user: true } },
        sections: { include: { _count: { select: { students: true } } } },
        subjects: true,
      },
    });

    if (!cls) throw new NotFoundException('Class not found');
    return cls;
  }

  async update(id: string, dto: UpdateClassDto, schoolId: string) {
    await this.findOne(id, schoolId);

    if (dto.classTeacherId) {
      const teacher = await this.prisma.teacher.findFirst({ where: { id: dto.classTeacherId, schoolId, status: 'ACTIVE' } });
      if (!teacher) throw new NotFoundException('Teacher not found or not active');
    }

    return this.prisma.class.update({
      where: { id },
      data: dto,
      include: { academicYear: true, classTeacher: { include: { user: true } } },
    });
  }

  async remove(id: string, schoolId: string) {
    await this.findOne(id, schoolId);

    const studentCount = await this.prisma.student.count({ where: { classId: id, schoolId } });
    if (studentCount > 0) throw new ConflictException('Cannot delete class with enrolled students');

    return this.prisma.class.delete({ where: { id } });
  }

  async getStats(schoolId: string, academicYearId?: string) {
    const year = academicYearId || (await this.prisma.academicYear.findFirst({ where: { schoolId, status: 'CURRENT' } }))?.id;
    if (!year) return [];

    return this.prisma.class.findMany({
      where: { schoolId, academicYearId: year },
      include: { _count: { select: { students: true, sections: true } }, classTeacher: { include: { user: true } } },
      orderBy: { level: 'asc' },
    });
  }
}