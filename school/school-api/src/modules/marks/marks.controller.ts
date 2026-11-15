import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MarksService } from './marks.service';
import { CreateMarkDto, BulkMarksDto, UpdateMarkDto, MarksQueryDto } from './dto/marks.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolScopeGuard } from '../../common/guards/school-scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentSchool, AuditLog } from '../../common/decorators';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('marks')
@Controller('marks')
@UseGuards(JwtAuthGuard, RolesGuard, SchoolScopeGuard)
@ApiBearerAuth()
export class MarksController {
  constructor(
    private marksService: MarksService,
    private prisma: PrismaService,
  ) {}

  @Post()
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Enter marks for student' })
  async createMark(
    @Body() dto: CreateMarkDto,
    @CurrentUser('id') userId: string,
    @CurrentSchool('id') schoolId: string,
  ) {
    const teacher = await this.getTeacherId(userId, schoolId);
    return this.marksService.createMark(dto, teacher, schoolId);
  }

  @Post('bulk')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Bulk enter marks' })
  async bulkCreateMarks(
    @Body() dto: BulkMarksDto,
    @CurrentUser('id') userId: string,
    @CurrentSchool('id') schoolId: string,
  ) {
    const teacher = await this.getTeacherId(userId, schoolId);
    return this.marksService.bulkCreateMarks(dto, teacher, schoolId);
  }

  @Get()
  @Roles(Role.HEADMASTER, Role.TEACHER, Role.PARENT)
  @ApiOperation({ summary: 'List marks with filters' })
  async findAll(
    @Query() query: MarksQueryDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.marksService.findAll(query, schoolId, userId, userRole);
  }

  @Get('student/:studentId/exam/:examId/report')
  @Roles(Role.HEADMASTER, Role.TEACHER, Role.PARENT)
  @ApiOperation({ summary: 'Get student exam report' })
  async getStudentReport(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('examId', ParseUUIDPipe) examId: string,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.marksService.getStudentReport(studentId, examId, schoolId);
  }

  @Patch(':id')
  @Roles(Role.HEADMASTER, Role.TEACHER)
  @ApiOperation({ summary: 'Update marks' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMarkDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.marksService.update(id, dto, userId, userRole, schoolId);
  }

  @Post('submit')
  @Roles(Role.TEACHER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit marks for approval' })
  async submitMarks(
    @Body('ids') ids: string[],
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.marksService.submitMarks(ids, schoolId);
  }

  @Post('approve')
  @Roles(Role.HEADMASTER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve submitted marks' })
  async approveMarks(
    @Body('ids') ids: string[],
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.marksService.approveMarks(ids, schoolId);
  }

  @Post('publish')
  @Roles(Role.HEADMASTER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish approved marks' })
  async publishMarks(
    @Body('ids') ids: string[],
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.marksService.publishMarks(ids, schoolId);
  }

  private async getTeacherId(userId: string, schoolId: string): Promise<string> {
    const teacher = await this.prisma.teacher.findFirst({ where: { userId, schoolId } });
    if (!teacher) throw new Error('Teacher profile not found');
    return teacher.id;
  }
}