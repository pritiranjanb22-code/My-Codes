import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogQueryDto } from './dto/audit-logs.dto';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: AuditLogQueryDto, schoolId?: string) {
    const { search, userId, entity, action, startDate, endDate, page = 1, limit = 50 } = query;
    const where: any = {};

    if (schoolId) where.schoolId = schoolId;

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entity: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (userId) where.userId = userId;
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: logs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getEntityHistory(entity: string, entityId: string, schoolId?: string) {
    const where: any = { entity, entityId };
    if (schoolId) where.schoolId = schoolId;

    return this.prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(schoolId?: string) {
    const where = schoolId ? { schoolId } : {};
    const [total, byAction, byEntity, recentActivity] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.groupBy({ by: ['action'], where, _count: true, orderBy: { _count: { action: 'desc' } }, take: 10 }),
      this.prisma.auditLog.groupBy({ by: ['entity'], where, _count: true, orderBy: { _count: { entity: 'desc' } }, take: 10 }),
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { firstName: true, lastName: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return { total, byAction, byEntity, recentActivity };
  }
}