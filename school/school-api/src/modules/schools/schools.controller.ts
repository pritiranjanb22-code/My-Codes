import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto, UpdateSchoolDto, SchoolQueryDto } from './dto/schools.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolScopeGuard } from '../../common/guards/school-scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentSchool } from '../../common/decorators';
import { Role, SchoolStatus } from '@prisma/client';

@ApiTags('schools')
@Controller('schools')
@UseGuards(JwtAuthGuard, RolesGuard, SchoolScopeGuard)
@ApiBearerAuth()
export class SchoolsController {
  constructor(private schoolsService: SchoolsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new school (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'School created' })
  async create(@Body() dto: CreateSchoolDto) {
    return this.schoolsService.create(dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all schools (Super Admin only)' })
  async findAll(@Query() query: SchoolQueryDto) {
    return this.schoolsService.findAll(query);
  }

  @Get('stats')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get system-wide school statistics' })
  async getStats() {
    return this.schoolsService.getStats();
  }

  @Get('dashboard')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Get headmaster dashboard stats' })
  async getDashboard(@CurrentSchool('id') schoolId: string) {
    return this.schoolsService.getDashboardStats(schoolId);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Get school by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    if (schoolId && id !== schoolId) {
      throw new Error('Access denied');
    }
    return this.schoolsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Update school' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSchoolDto,
    @CurrentSchool('id') schoolId: string,
  ) {
    if (schoolId && id !== schoolId) {
      throw new Error('Access denied');
    }
    return this.schoolsService.update(id, dto);
  }

  @Patch(':id/approve')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve pending school (Super Admin only)' })
  async approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolsService.approve(id);
  }

  @Patch(':id/suspend')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Suspend school (Super Admin only)' })
  async suspend(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolsService.suspend(id);
  }

  @Patch(':id/activate')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activate suspended school (Super Admin only)' })
  async activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolsService.activate(id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Archive school (Super Admin only)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolsService.remove(id);
  }
}