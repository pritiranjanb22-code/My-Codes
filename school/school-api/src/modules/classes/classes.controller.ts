import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto, ClassQueryDto } from './dto/classes.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolScopeGuard } from '../../common/guards/school-scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentSchool } from '../../common/decorators';
import { Role } from '@prisma/client';

@ApiTags('classes')
@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard, SchoolScopeGuard)
@ApiBearerAuth()
export class ClassesController {
  constructor(private classesService: ClassesService) {}

  @Post()
  @Roles('HEADMASTER')
  @ApiOperation({ summary: 'Create new class' })
  async create(@Body() dto: CreateClassDto, @CurrentSchool('id') schoolId: string) {
    return this.classesService.create(dto, schoolId);
  }

  @Get()
  @Roles('HEADMASTER', 'TEACHER')
  @ApiOperation({ summary: 'List classes' })
  async findAll(@Query() query: ClassQueryDto, @CurrentSchool('id') schoolId: string) {
    return this.classesService.findAll(query, schoolId);
  }

  @Get('stats')
  @Roles('HEADMASTER', 'TEACHER')
  @ApiOperation({ summary: 'Get class statistics' })
  async getStats(@Query('academicYearId') academicYearId?: string, @CurrentSchool('id') schoolId?: string) {
    return this.classesService.getStats(schoolId!, academicYearId);
  }

  @Get(':id')
  @Roles('HEADMASTER', 'TEACHER')
  @ApiOperation({ summary: 'Get class by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.classesService.findOne(id, schoolId);
  }

  @Patch(':id')
  @Roles('HEADMASTER')
  @ApiOperation({ summary: 'Update class' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClassDto,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.classesService.update(id, dto, schoolId);
  }

  @Delete(':id')
  @Roles('HEADMASTER')
  @ApiOperation({ summary: 'Delete class' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.classesService.remove(id, schoolId);
  }
}