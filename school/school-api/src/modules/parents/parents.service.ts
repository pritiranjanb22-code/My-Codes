import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateParentDto, UpdateParentDto, LinkStudentDto, ParentQueryDto } from './dto/parents.dto';
import { Role, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';

@Injectable()
export class ParentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateParentDto, schoolId: string, createdById: string) {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });

    if (existingUser) throw new ConflictException('Email or phone already registered');

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: Role.PARENT,
        firstName: dto.firstName,
        lastName: dto.lastName,
        schoolId,
        createdById,
        status: UserStatus.ACTIVE,
      },
    });

    const parent = await this.prisma.parent.create({
      data: {
        userId: user.id,
        occupation: dto.occupation,
        address: dto.address,
        schoolId,
      },
    });

    return { user: this.sanitizeUser(user), parent };
  }

  async findAll(query: ParentQueryDto, schoolId: string) {
    const { search, page = 1, limit = 10 } = query;
    const where: any = { schoolId };

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      };
    }

    const [parents, total] = await Promise.all([
      this.prisma.parent.findMany({
        where,
        include: {
          user: true,
          children: { include: { student: { include: { class: true, section: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.parent.count({ where }),
    ]);

    return {
      data: parents.map(p => ({ ...p, user: this.sanitizeUser(p.user) })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, schoolId: string) {
    const parent = await this.prisma.parent.findFirst({
      where: { id, schoolId },
      include: {
        user: true,
        children: { include: { student: { include: { class: true, section: true } } } },
      },
    });

    if (!parent) throw new NotFoundException('Parent not found');
    return { ...parent, user: this.sanitizeUser(parent.user) };
  }

  async findByUserId(userId: string, schoolId: string) {
    const parent = await this.prisma.parent.findFirst({
      where: { userId, schoolId },
      include: {
        user: true,
        children: { include: { student: { include: { class: true, section: true } } } },
      },
    });

    if (!parent) throw new NotFoundException('Parent not found');
    return { ...parent, user: this.sanitizeUser(parent.user) };
  }

  async update(id: string, dto: UpdateParentDto, schoolId: string) {
    await this.findOne(id, schoolId);

    if (dto.phone) {
      const existing = await this.prisma.user.findFirst({ where: { phone: dto.phone, NOT: { id: (await this.findOne(id, schoolId)).userId } } });
      if (existing) throw new ConflictException('Phone already in use');
    }

    const updated = await this.prisma.parent.update({
      where: { id },
      data: dto,
      include: { user: true, children: { include: { student: { include: { class: true, section: true } } } } },
    });

    return { ...updated, user: this.sanitizeUser(updated.user) };
  }

  async linkStudent(id: string, dto: LinkStudentDto, schoolId: string) {
    const parent = await this.findOne(id, schoolId);
    const student = await this.prisma.student.findFirst({ where: { id: dto.studentId, schoolId } });

    if (!student) throw new NotFoundException('Student not found');

    const existingLink = await this.prisma.parentStudent.findFirst({
      where: { parentId: id, studentId: dto.studentId },
    });

    if (existingLink) throw new ConflictException('Student already linked to this parent');

    if (dto.isPrimary) {
      await this.prisma.parentStudent.updateMany({
        where: { parentId: id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.parentStudent.create({
      data: { parentId: id, studentId: dto.studentId, relation: dto.relation, isPrimary: dto.isPrimary || false },
    });
  }

  async unlinkStudent(parentId: string, studentId: string, schoolId: string) {
    await this.findOne(parentId, schoolId);

    const link = await this.prisma.parentStudent.findFirst({
      where: { parentId, studentId },
    });

    if (!link) throw new NotFoundException('Link not found');

    return this.prisma.parentStudent.delete({ where: { id: link.id } });
  }

  async getMyChildren(userId: string, schoolId: string) {
    const parent = await this.findByUserId(userId, schoolId);
    return parent.children;
  }

  async getStudentAttendance(parentId: string, studentId: string, schoolId: string, academicYearId?: string) {
    const parent = await this.findOne(parentId, schoolId);
    const isLinked = parent.children.some(c => c.studentId === studentId);
    if (!isLinked) throw new ForbiddenException('Not authorized to view this student');

    const year = academicYearId || (await this.prisma.academicYear.findFirst({ where: { schoolId, status: 'CURRENT' } }))?.id;

    const where: any = { studentId, schoolId };
    if (year) where.academicYearId = year;

    const attendances = await this.prisma.attendance.findMany({
      where,
      orderBy: { date: 'asc' },
      include: { teacher: { include: { user: true } } },
    });

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

    return { stats, attendances };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, refreshToken, resetToken, resetTokenExpiry, ...sanitized } = user;
    return sanitized;
  }
}