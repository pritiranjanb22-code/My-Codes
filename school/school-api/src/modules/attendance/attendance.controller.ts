import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { BulkAttendanceDto, UpdateAttendanceDto, AttendanceQueryDto, OfflineSyncDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolScopeGuard } from '../../common/guards/school-scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentSchool, AuditLog } from '../../common/decorators';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard, SchoolScopeGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(
    private attendanceService: AttendanceService,
    private prisma: PrismaService,
  ) {}

  @Post()
  @Roles(Role.TEACHER, Role.HEADMASTER)
  @ApiOperation({ summary: 'Mark attendance for class/section' })
  @ApiResponse({ status: 201, description: 'Attendance recorded' })
  @ApiResponse({ status: 409, description: 'Attendance already submitted' })
  async markAttendance(
    @Body() dto: BulkAttendanceDto,
    @CurrentUser('id') userId: string,
    @CurrentSchool('id') schoolId: string,
    @AuditLog({ action: 'MARK_ATTENDANCE', entity: 'Attendance', entityId: '' }) auditLog: any,
  ) {
    const teacher = await this.getTeacherId(userId, schoolId);
    return this.attendanceService.markAttendance(dto, teacher, schoolId);
  }

  @Post('offline-sync')
  @Roles(Role.TEACHER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync offline attendance records' })
  async syncOffline(
    @Body() dto: OfflineSyncDto,
    @CurrentUser('id') userId: string,
    @CurrentSchool('id') schoolId: string,
  ) {
    const teacher = await this.getTeacherId(userId, schoolId);
    return this.attendanceService.syncOffline(dto, teacher, schoolId);
  }

  @Get()
  @Roles(Role.HEADMASTER, Role.TEACHER, Role.PARENT)
  @ApiOperation({ summary: 'List attendance records with filters' })
  async findAll(
    @Query() query: AttendanceQueryDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.attendanceService.findAll(query, schoolId, userId, userRole);
  }

  @Get('today-stats')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: "Get today's attendance statistics" })
  async getTodayStats(@CurrentSchool('id') schoolId: string) {
    return this.attendanceService.getTodayStats(schoolId);
  }

  @Get('class/:classId/section/:sectionId/date/:date')
  @Roles(Role.HEADMASTER, Role.TEACHER)
  @ApiOperation({ summary: 'Get attendance for class/section on specific date' })
  async getClassAttendance(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('date') date: string,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.attendanceService.getClassAttendance(classId, sectionId, date, schoolId);
  }

  @Get('student/:studentId/report')
  @Roles(Role.HEADMASTER, Role.TEACHER, Role.PARENT)
  @ApiOperation({ summary: 'Get student attendance report' })
  async getStudentReport(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentSchool('id') schoolId?: string,
  ) {
    return this.attendanceService.getStudentReport(
      studentId,
      schoolId!,
      academicYearId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('class/:classId/section/:sectionId/report')
  @Roles(Role.HEADMASTER, Role.TEACHER)
  @ApiOperation({ summary: 'Get class attendance report' })
  async getClassReport(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentSchool('id') schoolId?: string,
  ) {
    return this.attendanceService.getClassReport(
      classId,
      sectionId,
      schoolId!,
      academicYearId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Patch(':id')
  @Roles(Role.HEADMASTER, Role.TEACHER)
  @ApiOperation({ summary: 'Update attendance record' })
  async updateAttendance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttendanceDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentSchool('id') schoolId: string,
    @AuditLog({ action: 'UPDATE_ATTENDANCE', entity: 'Attendance', entityId: '' }) auditLog: any,
  ) {
    return this.attendanceService.updateAttendance(id, dto, userId, userRole, schoolId);
  }

  private async getTeacherId(userId: string, schoolId: string): Promise<string> {
    const teacher = await this.prisma.teacher.findFirst({ where: { userId, schoolId } });
    if (!teacher) throw new Error('Teacher profile not found');
    return teacher.id;
  }
}