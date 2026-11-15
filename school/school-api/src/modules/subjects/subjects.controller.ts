import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto, UpdateSubjectDto, SubjectQueryDto } from './dto/subjects.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolScopeGuard } from '../../common/guards/school-scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentSchool } from '../../common/decorators';
import { Role } from '@prisma/client';

@ApiTags('subjects')
@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard, SchoolScopeGuard)
@ApiBearerAuth()
export class SubjectsController {
  constructor(private subjectsService: SubjectsService) {}

  @Post()
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Create new subject' })
  async create(@Body() dto: CreateSubjectDto, @CurrentSchool('id') schoolId: string) {
    return this.subjectsService.create(dto, schoolId);
  }

  @Get()
  @Roles(Role.HEADMASTER, Role.TEACHER)
  @ApiOperation({ summary: 'List subjects' })
  async findAll(@Query() query: SubjectQueryDto, @CurrentSchool('id') schoolId: string) {
    return this.subjectsService.findAll(query, schoolId);
  }

  @Get(':id')
  @Roles(Role.HEADMASTER, Role.TEACHER)
  @ApiOperation({ summary: 'Get subject by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.subjectsService.findOne(id, schoolId);
  }

  @Patch(':id')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Update subject' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubjectDto,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.subjectsService.update(id, dto, schoolId);
  }

  @Delete(':id')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Deactivate subject' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.subjectsService.remove(id, schoolId);
  }
}