import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, ApproveUserDto, UserQueryDto } from './dto/users.dto';
import { Role, UserStatus, User } from '@prisma/client';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto, schoolId: string, createdById: string) {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });

    if (existingUser) {
      throw new ConflictException('Email or phone already registered');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        ...dto,
        passwordHash,
        schoolId,
        createdById,
        status: dto.role === Role.HEADMASTER ? UserStatus.PENDING : UserStatus.ACTIVE,
      },
    });

    return this.sanitizeUser(user);
  }

  async findAll(query: UserQueryDto, schoolId?: string) {
    const { search, role, status, page = 1, limit = 10 } = query;
    const where: any = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { school: true, teacher: true, parent: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map(u => this.sanitizeUser(u)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, schoolId?: string) {
    const where: any = { id };
    if (schoolId) where.schoolId = schoolId;

    const user = await this.prisma.user.findUnique({
      where,
      include: { school: true, teacher: true, parent: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async update(id: string, dto: UpdateUserDto, schoolId?: string) {
    const user = await this.findOne(id, schoolId);

    if (dto.phone) {
      const existing = await this.prisma.user.findFirst({
        where: { phone: dto.phone, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Phone already in use');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: dto,
      include: { school: true, teacher: true, parent: true },
    });

    return this.sanitizeUser(updated);
  }

  async approve(id: string, dto: ApproveUserDto, approvedById: string, schoolId?: string) {
    const user = await this.findOne(id, schoolId);

    if (user.status === UserStatus.ACTIVE) {
      throw new ConflictException('User is already active');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        status: dto.status,
        approvedById,
        approvedAt: new Date(),
      },
      include: { school: true },
    });

    return this.sanitizeUser(updated);
  }

  async suspend(id: string, schoolId?: string) {
    const user = await this.findOne(id, schoolId);

    if (user.status === UserStatus.SUSPENDED) {
      throw new ConflictException('User is already suspended');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.SUSPENDED },
    });

    return this.sanitizeUser(updated);
  }

  async activate(id: string, schoolId?: string) {
    const user = await this.findOne(id, schoolId);

    if (user.status === UserStatus.ACTIVE) {
      throw new ConflictException('User is already active');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.ACTIVE },
    });

    return this.sanitizeUser(updated);
  }

  async remove(id: string, schoolId?: string) {
    await this.findOne(id, schoolId);

    await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.SUSPENDED },
    });

    return { message: 'User suspended' };
  }

  async getPendingApprovals(schoolId?: string) {
    const where: any = { status: UserStatus.PENDING };
    if (schoolId) where.schoolId = schoolId;

    return this.prisma.user.findMany({
      where,
      include: { school: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getStats(schoolId?: string) {
    const where = schoolId ? { schoolId } : {};

    const [total, active, pending, suspended, byRole] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.count({ where: { ...where, status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { ...where, status: UserStatus.PENDING } }),
      this.prisma.user.count({ where: { ...where, status: UserStatus.SUSPENDED } }),
      this.prisma.user.groupBy({ by: ['role'], where, _count: true }),
    ]);

    return {
      total,
      active,
      pending,
      suspended,
      byRole: byRole.reduce((acc, r) => ({ ...acc, [r.role]: r._count }), {}),
    };
  }

  private sanitizeUser(user: User & { school?: any; teacher?: any; parent?: any }) {
    const { passwordHash, refreshToken, resetToken, resetTokenExpiry, ...sanitized } = user;
    return sanitized;
  }
}