import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, BulkCreateStudentDto, StudentQueryDto, PromoteStudentDto, TransferStudentDto } from './dto/students.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolScopeGuard } from '../../common/guards/school-scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentSchool, AuditLog } from '../../common/decorators';
import { Role, StudentStatus } from '@prisma/client';

@ApiTags('students')
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard, SchoolScopeGuard)
@ApiBearerAuth()
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  @Post()
  @Roles(Role.HEADMASTER, Role.TEACHER)
  @ApiOperation({ summary: 'Create new student' })
  async create(@Body() dto: CreateStudentDto, @CurrentSchool('id') schoolId: string) {
    return this.studentsService.create(dto, schoolId);
  }

  @Post('bulk')
  @Roles(Role.HEADMASTER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk create students' })
  async bulkCreate(@Body() dto: BulkCreateStudentDto, @CurrentSchool('id') schoolId: string) {
    return this.studentsService.bulkCreate(dto, schoolId);
  }

  @Get()
  @Roles(Role.HEADMASTER, Role.TEACHER, Role.PARENT)
  @ApiOperation({ summary: 'List students with filters' })
  async findAll(@Query() query: StudentQueryDto, @CurrentSchool('id') schoolId: string) {
    return this.studentsService.findAll(query, schoolId);
  }

  @Get('stats')
  @Roles(Role.HEADMASTER, Role.TEACHER)
  @ApiOperation({ summary: 'Get student statistics' })
  async getStats(@CurrentSchool('id') schoolId: string) {
    return this.studentsService.getStats(schoolId);
  }

  @Get(':id')
  @Roles(Role.HEADMASTER, Role.TEACHER, Role.PARENT)
  @ApiOperation({ summary: 'Get student by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.studentsService.findOne(id, schoolId);
  }

  @Get(':id/attendance-report')
  @Roles(Role.HEADMASTER, Role.TEACHER, Role.PARENT)
  @ApiOperation({ summary: 'Get student attendance report' })
  async getAttendanceReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentSchool('id') schoolId?: string,
  ) {
    return this.studentsService.getAttendanceReport(
      id,
      schoolId!,
      academicYearId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Patch(':id')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Update student' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudentDto,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.studentsService.update(id, dto, schoolId);
  }

  @Patch(':id/promote')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Promote student to next class' })
  async promote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PromoteStudentDto,
    @CurrentSchool('id') schoolId: string,
    @AuditLog({ action: 'PROMOTE_STUDENT', entity: 'Student', entityId: id }) auditLog: any,
  ) {
    return this.studentsService.promote(id, dto, schoolId);
  }

  @Patch(':id/transfer')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Transfer student to another school' })
  async transfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferStudentDto,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.studentsService.transfer(id, dto, schoolId);
  }

  @Patch(':id/deactivate')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Deactivate student' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.studentsService.deactivate(id, schoolId);
  }

  @Delete(':id')
  @Roles(Role.HEADMASTER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate student (soft delete)' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.studentsService.deactivate(id, schoolId);
  }
}