import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto, AnnouncementQueryDto } from './dto/announcements.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAnnouncementDto, schoolId: string, authorId: string) {
    return this.prisma.announcement.create({
      data: { ...dto, schoolId, authorId, publishedAt: new Date() },
      include: { author: true },
    });
  }

  async findAll(query: AnnouncementQueryDto, schoolId: string) {
    const { search, targetAudience, page = 1, limit = 10 } = query;
    const where: any = { schoolId };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (targetAudience) where.targetAudience = targetAudience;

    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        include: { author: true },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return { data: announcements, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findPublished(schoolId: string, userId?: string, userRole?: string) {
    const where: any = { schoolId, publishedAt: { lte: new Date() } };

    if (userRole === 'PARENT') {
      const parent = await this.prisma.parent.findFirst({ where: { userId, schoolId } });
      if (parent) {
        const childClasses = parent.children.map(c => c.student.classId);
        const childSections = parent.children.map(c => c.student.sectionId);
        where.OR = [
          { targetAudience: 'ALL_PARENTS' },
          { targetAudience: 'CLASS', targetClassId: { in: childClasses } },
          { targetAudience: 'SECTION', targetSectionId: { in: childSections } },
        ];
      }
    } else if (userRole === 'TEACHER') {
      const teacher = await this.prisma.teacher.findFirst({ where: { userId, schoolId } });
      if (teacher) {
        const assignedClasses = teacher.assignments.map(a => a.classId);
        const assignedSections = teacher.assignments.map(a => a.sectionId);
        where.OR = [
          { targetAudience: 'ALL_TEACHERS' },
          { targetAudience: 'CLASS', targetClassId: { in: assignedClasses } },
          { targetAudience: 'SECTION', targetSectionId: { in: assignedSections } },
        ];
      }
    }

    return this.prisma.announcement.findMany({
      where,
      include: { author: true },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    });
  }

  async findOne(id: string, schoolId: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id, schoolId },
      include: { author: true },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement;
  }

  async update(id: string, dto: UpdateAnnouncementDto, schoolId: string) {
    await this.findOne(id, schoolId);
    return this.prisma.announcement.update({
      where: { id },
      data: dto,
      include: { author: true },
    });
  }

  async remove(id: string, schoolId: string) {
    await this.findOne(id, schoolId);
    return this.prisma.announcement.delete({ where: { id } });
  }
}