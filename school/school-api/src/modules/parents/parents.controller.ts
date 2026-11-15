import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ParentsService } from './parents.service';
import { CreateParentDto, UpdateParentDto, LinkStudentDto, ParentQueryDto } from './dto/parents.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolScopeGuard } from '../../common/guards/school-scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentSchool, CurrentUser } from '../../common/decorators';
import { Role } from '@prisma/client';

@ApiTags('parents')
@Controller('parents')
@UseGuards(JwtAuthGuard, RolesGuard, SchoolScopeGuard)
@ApiBearerAuth()
export class ParentsController {
  constructor(private parentsService: ParentsService) {}

  @Post()
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Create parent account' })
  async create(
    @Body() dto: CreateParentDto,
    @CurrentSchool('id') schoolId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.parentsService.create(dto, schoolId, userId);
  }

  @Get()
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'List parents' })
  async findAll(@Query() query: ParentQueryDto, @CurrentSchool('id') schoolId: string) {
    return this.parentsService.findAll(query, schoolId);
  }

  @Get('my-children')
  @Roles(Role.PARENT)
  @ApiOperation({ summary: 'Get my linked children' })
  async getMyChildren(@CurrentUser('id') userId: string, @CurrentSchool('id') schoolId: string) {
    return this.parentsService.getMyChildren(userId, schoolId);
  }

  @Get(':id')
  @Roles(Role.HEADMASTER, Role.PARENT)
  @ApiOperation({ summary: 'Get parent by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.parentsService.findOne(id, schoolId);
  }

  @Get(':parentId/students/:studentId/attendance')
  @Roles(Role.HEADMASTER, Role.PARENT)
  @ApiOperation({ summary: 'Get student attendance for parent' })
  async getStudentAttendance(
    @Param('parentId', ParseUUIDPipe) parentId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('academicYearId') academicYearId?: string,
    @CurrentSchool('id') schoolId?: string,
  ) {
    return this.parentsService.getStudentAttendance(parentId, studentId, schoolId!, academicYearId);
  }

  @Patch(':id')
  @Roles(Role.HEADMASTER, Role.PARENT)
  @ApiOperation({ summary: 'Update parent' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateParentDto,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.parentsService.update(id, dto, schoolId);
  }

  @Post(':id/link-student')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Link student to parent' })
  async linkStudent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkStudentDto,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.parentsService.linkStudent(id, dto, schoolId);
  }

  @Delete(':parentId/unlink-student/:studentId')
  @Roles(Role.HEADMASTER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlink student from parent' })
  async unlinkStudent(
    @Param('parentId', ParseUUIDPipe) parentId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.parentsService.unlinkStudent(parentId, studentId, schoolId);
  }
}