import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSchoolDto, UpdateSchoolDto, SchoolQueryDto } from './dto/schools.dto';
import { SchoolStatus } from '@prisma/client';

@Injectable()
export class SchoolsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSchoolDto) {
    const existing = await this.prisma.school.findFirst({
      where: { OR: [{ code: dto.code.toUpperCase() }, { registrationNo: dto.registrationNo }] },
    });

    if (existing) {
      throw new ConflictException('School code or registration number already exists');
    }

    return this.prisma.school.create({
      data: { ...dto, code: dto.code.toUpperCase() },
    });
  }

  async findAll(query: SchoolQueryDto) {
    const { search, status, page = 1, limit = 10 } = query;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;

    const [schools, total] = await Promise.all([
      this.prisma.school.findMany({
        where,
        include: {
          _count: { select: { users: true, students: true, teachers: true } },
          users: { where: { role: 'HEADMASTER' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.school.count({ where }),
    ]);

    return {
      data: schools,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, students: true, teachers: true, classes: true } },
        users: { where: { role: 'HEADMASTER' } },
        academicYears: { where: { status: 'CURRENT' }, take: 1 },
      },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    return school;
  }

  async update(id: string, dto: UpdateSchoolDto) {
    await this.findOne(id);

    if (dto.code) {
      const existing = await this.prisma.school.findFirst({
        where: { code: dto.code.toUpperCase(), NOT: { id } },
      });
      if (existing) throw new ConflictException('School code already exists');
    }

    return this.prisma.school.update({
      where: { id },
      data: { ...dto, code: dto.code?.toUpperCase() },
    });
  }

  async approve(id: string) {
    const school = await this.findOne(id);

    if (school.status === SchoolStatus.ACTIVE) {
      throw new ConflictException('School is already active');
    }

    return this.prisma.school.update({
      where: { id },
      data: { status: SchoolStatus.ACTIVE },
    });
  }

  async suspend(id: string) {
    const school = await this.findOne(id);

    if (school.status === SchoolStatus.SUSPENDED) {
      throw new ConflictException('School is already suspended');
    }

    return this.prisma.school.update({
      where: { id },
      data: { status: SchoolStatus.SUSPENDED },
    });
  }

  async activate(id: string) {
    const school = await this.findOne(id);

    if (school.status === SchoolStatus.ACTIVE) {
      throw new ConflictException('School is already active');
    }

    return this.prisma.school.update({
      where: { id },
      data: { status: SchoolStatus.ACTIVE },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.school.update({ where: { id }, data: { status: SchoolStatus.ARCHIVED } });
  }

  async getStats() {
    const [total, active, pending, suspended, totalStudents, totalTeachers, totalHeadmasters] = await Promise.all([
      this.prisma.school.count(),
      this.prisma.school.count({ where: { status: SchoolStatus.ACTIVE } }),
      this.prisma.school.count({ where: { status: SchoolStatus.PENDING } }),
      this.prisma.school.count({ where: { status: SchoolStatus.SUSPENDED } }),
      this.prisma.student.count(),
      this.prisma.teacher.count(),
      this.prisma.user.count({ where: { role: 'HEADMASTER', status: 'ACTIVE' } }),
    ]);

    return { total, active, pending, suspended, totalStudents, totalTeachers, totalHeadmasters };
  }

  async getDashboardStats(schoolId: string) {
    const [
      totalStudents,
      totalTeachers,
      todayAttendance,
      presentCount,
      absentCount,
      pendingTeacherApprovals,
      recentAnnouncements,
      upcomingHolidays,
    ] = await Promise.all([
      this.prisma.student.count({ where: { schoolId, status: 'ACTIVE' } }),
      this.prisma.teacher.count({ where: { schoolId, status: 'ACTIVE' } }),
      this.prisma.attendance.count({
        where: {
          schoolId,
          date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.attendance.count({
        where: {
          schoolId,
          date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          status: 'PRESENT',
        },
      }),
      this.prisma.attendance.count({
        where: {
          schoolId,
          date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          status: 'ABSENT',
        },
      }),
      this.prisma.user.count({ where: { schoolId, role: 'TEACHER', status: 'PENDING' } }),
      this.prisma.announcement.findMany({
        where: { schoolId, publishedAt: { lte: new Date() } },
        orderBy: { publishedAt: 'desc' },
        take: 5,
      }),
      this.prisma.holiday.findMany({
        where: { schoolId, startDate: { gte: new Date() } },
        orderBy: { startDate: 'asc' },
        take: 5,
      }),
    ]);

    const attendancePercent = todayAttendance > 0 ? ((presentCount / todayAttendance) * 100).toFixed(1) : '0';

    return {
      totalStudents,
      totalTeachers,
      todayAttendance,
      presentCount,
      absentCount,
      attendancePercent: parseFloat(attendancePercent),
      pendingTeacherApprovals,
      recentAnnouncements,
      upcomingHolidays,
    };
  }
}