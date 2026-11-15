import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { CreateExamTypeDto, CreateExamDto, CreateExamSubjectDto, ExamQueryDto } from './dto/exams.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolScopeGuard } from '../../common/guards/school-scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentSchool } from '../../common/decorators';
import { Role } from '@prisma/client';

@ApiTags('exams')
@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard, SchoolScopeGuard)
@ApiBearerAuth()
export class ExamsController {
  constructor(private examsService: ExamsService) {}

  @Post('types')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Create exam type' })
  async createExamType(@Body() dto: CreateExamTypeDto, @CurrentSchool('id') schoolId: string) {
    return this.examsService.createExamType(dto, schoolId);
  }

  @Get('types')
  @Roles(Role.HEADMASTER, Role.TEACHER)
  @ApiOperation({ summary: 'List exam types' })
  async getExamTypes(@CurrentSchool('id') schoolId: string) {
    return this.examsService.getExamTypes(schoolId);
  }

  @Post()
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Create exam' })
  async createExam(@Body() dto: CreateExamDto, @CurrentSchool('id') schoolId: string) {
    return this.examsService.createExam(dto, schoolId);
  }

  @Get()
  @Roles(Role.HEADMASTER, Role.TEACHER)
  @ApiOperation({ summary: 'List exams' })
  async findAll(@Query() query: ExamQueryDto, @CurrentSchool('id') schoolId: string) {
    return this.examsService.findAll(query, schoolId);
  }

  @Get(':id')
  @Roles(Role.HEADMASTER, Role.TEACHER)
  @ApiOperation({ summary: 'Get exam by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.examsService.findOne(id, schoolId);
  }

  @Post(':id/subjects')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Add subject to exam' })
  async addSubject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateExamSubjectDto,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.examsService.addSubject(id, dto, schoolId);
  }

  @Patch(':id/status')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Update exam status' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.examsService.updateStatus(id, status, schoolId);
  }

  @Delete(':id')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Delete exam' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.examsService.remove(id, schoolId);
  }
}