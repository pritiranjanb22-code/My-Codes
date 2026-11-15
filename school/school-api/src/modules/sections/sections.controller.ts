import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SectionsService } from './sections.service';
import { CreateSectionDto, UpdateSectionDto, SectionQueryDto } from './dto/sections.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolScopeGuard } from '../../common/guards/school-scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentSchool } from '../../common/decorators';
import { Role } from '@prisma/client';

@ApiTags('sections')
@Controller('sections')
@UseGuards(JwtAuthGuard, RolesGuard, SchoolScopeGuard)
@ApiBearerAuth()
export class SectionsController {
  constructor(private sectionsService: SectionsService) {}

  @Post()
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Create new section' })
  async create(@Body() dto: CreateSectionDto, @CurrentSchool('id') schoolId: string) {
    return this.sectionsService.create(dto, schoolId);
  }

  @Get()
  @Roles(Role.HEADMASTER, Role.TEACHER)
  @ApiOperation({ summary: 'List sections' })
  async findAll(@Query() query: SectionQueryDto, @CurrentSchool('id') schoolId: string) {
    return this.sectionsService.findAll(query, schoolId);
  }

  @Get(':id')
  @Roles(Role.HEADMASTER, Role.TEACHER)
  @ApiOperation({ summary: 'Get section by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.sectionsService.findOne(id, schoolId);
  }

  @Patch(':id')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Update section' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSectionDto,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.sectionsService.update(id, dto, schoolId);
  }

  @Delete(':id')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Delete section' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.sectionsService.remove(id, schoolId);
  }
}