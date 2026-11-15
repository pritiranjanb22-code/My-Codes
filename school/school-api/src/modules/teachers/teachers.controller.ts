import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto, UpdateTeacherDto, TeacherAssignmentDto, TeacherQueryDto } from './dto/teachers.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolScopeGuard } from '../../common/guards/school-scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentSchool, CurrentUser } from '../../common/decorators';
import { Role, UserStatus } from '@prisma/client';

@ApiTags('teachers')
@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard, SchoolScopeGuard)
@ApiBearerAuth()
export class TeachersController {
  constructor(private teachersService: TeachersService) {}

  @Post()
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Create/invite new teacher' })
  async create(
    @Body() dto: CreateTeacherDto,
    @CurrentSchool('id') schoolId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.teachersService.create(dto, schoolId, userId);
  }

  @Get()
  @Roles(Role.HEADMASTER, Role.TEACHER)
  @ApiOperation({ summary: 'List teachers with filters' })
  async findAll(@Query() query: TeacherQueryDto, @CurrentSchool('id') schoolId: string) {
    return this.teachersService.findAll(query, schoolId);
  }

  @Get('stats')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Get teacher statistics' })
  async getStats(@CurrentSchool('id') schoolId: string) {
    return this.teachersService.getStats(schoolId);
  }

  @Get('my-classes')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Get current teacher assigned classes' })
  async getMyClasses(@CurrentUser('id') userId: string, @CurrentSchool('id') schoolId: string) {
    const teacher = await this.teachersService.findByUserId(userId, schoolId);
    return this.teachersService.getMyClasses(teacher.id, schoolId);
  }

  @Get(':id')
  @Roles(Role.HEADMASTER, Role.TEACHER)
  @ApiOperation({ summary: 'Get teacher by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.teachersService.findOne(id, schoolId);
  }

  @Patch(':id')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Update teacher' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeacherDto,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.teachersService.update(id, dto, schoolId);
  }

  @Patch(':id/approve')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Approve pending teacher' })
  async approve(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.teachersService.approve(id, schoolId);
  }

  @Patch(':id/suspend')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Suspend teacher' })
  async suspend(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.teachersService.suspend(id, schoolId);
  }

  @Patch(':id/activate')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Activate suspended teacher' })
  async activate(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.teachersService.activate(id, schoolId);
  }

  @Post('assignments')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Assign subject to teacher' })
  async assignSubject(@Body() dto: TeacherAssignmentDto, @CurrentSchool('id') schoolId: string) {
    return this.teachersService.assignSubject(dto, schoolId);
  }

  @Delete('assignments/:assignmentId')
  @Roles(Role.HEADMASTER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove teacher assignment' })
  async removeAssignment(
    @Param('teacherId', ParseUUIDPipe) teacherId: string,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.teachersService.removeAssignment(teacherId, assignmentId, schoolId);
  }

  @Delete(':id')
  @Roles(Role.HEADMASTER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend teacher (soft delete)' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.teachersService.suspend(id, schoolId);
  }
}