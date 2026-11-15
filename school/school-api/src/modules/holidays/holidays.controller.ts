import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HolidaysService } from './holidays.service';
import { CreateHolidayDto, UpdateHolidayDto, HolidayQueryDto } from './dto/holidays.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolScopeGuard } from '../../common/guards/school-scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentSchool } from '../../common/decorators';
import { Role } from '@prisma/client';

@ApiTags('holidays')
@Controller('holidays')
@UseGuards(JwtAuthGuard, RolesGuard, SchoolScopeGuard)
@ApiBearerAuth()
export class HolidaysController {
  constructor(private holidaysService: HolidaysService) {}

  @Post()
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Create holiday' })
  async create(@Body() dto: CreateHolidayDto, @CurrentSchool('id') schoolId: string) {
    return this.holidaysService.create(dto, schoolId);
  }

  @Get()
  @Roles(Role.HEADMASTER, Role.TEACHER, Role.PARENT)
  @ApiOperation({ summary: 'List holidays' })
  async findAll(@Query() query: HolidayQueryDto, @CurrentSchool('id') schoolId: string) {
    return this.holidaysService.findAll(query, schoolId);
  }

  @Get('upcoming')
  @Roles(Role.HEADMASTER, Role.TEACHER, Role.PARENT)
  @ApiOperation({ summary: 'Get upcoming holidays' })
  async getUpcoming(@Query('days') days?: number, @CurrentSchool('id') schoolId?: string) {
    return this.holidaysService.getUpcoming(schoolId!, days || 30);
  }

  @Get(':id')
  @Roles(Role.HEADMASTER, Role.TEACHER, Role.PARENT)
  @ApiOperation({ summary: 'Get holiday by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.holidaysService.findOne(id, schoolId);
  }

  @Patch(':id')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Update holiday' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHolidayDto,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.holidaysService.update(id, dto, schoolId);
  }

  @Delete(':id')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Delete holiday' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.holidaysService.remove(id, schoolId);
  }
}