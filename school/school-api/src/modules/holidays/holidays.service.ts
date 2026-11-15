import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHolidayDto, UpdateHolidayDto, HolidayQueryDto } from './dto/holidays.dto';

@Injectable()
export class HolidaysService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateHolidayDto, schoolId: string) {
    return this.prisma.holiday.create({
      data: { ...dto, schoolId, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) },
    });
  }

  async findAll(query: HolidayQueryDto, schoolId: string) {
    const { search, startDate, endDate, page = 1, limit = 10 } = query;
    const where: any = { schoolId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    const [holidays, total] = await Promise.all([
      this.prisma.holiday.findMany({
        where,
        orderBy: { startDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.holiday.count({ where }),
    ]);

    return { data: holidays, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, schoolId: string) {
    const holiday = await this.prisma.holiday.findFirst({ where: { id, schoolId } });
    if (!holiday) throw new NotFoundException('Holiday not found');
    return holiday;
  }

  async update(id: string, dto: UpdateHolidayDto, schoolId: string) {
    await this.findOne(id, schoolId);
    return this.prisma.holiday.update({
      where: { id },
      data: { ...dto, startDate: dto.startDate ? new Date(dto.startDate) : undefined, endDate: dto.endDate ? new Date(dto.endDate) : undefined },
    });
  }

  async remove(id: string, schoolId: string) {
    await this.findOne(id, schoolId);
    return this.prisma.holiday.delete({ where: { id } });
  }

  async getUpcoming(schoolId: string, days: number = 30) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.prisma.holiday.findMany({
      where: { schoolId, startDate: { gte: new Date(), lte: endDate } },
      orderBy: { startDate: 'asc' },
    });
  }
}