import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto, AnnouncementQueryDto } from './dto/announcements.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolScopeGuard } from '../../common/guards/school-scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentSchool } from '../../common/decorators';
import { Role } from '@prisma/client';

@ApiTags('announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard, SchoolScopeGuard)
@ApiBearerAuth()
export class AnnouncementsController {
  constructor(private announcementsService: AnnouncementsService) {}

  @Post()
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Create announcement' })
  async create(
    @Body() dto: CreateAnnouncementDto,
    @CurrentUser('id') userId: string,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.announcementsService.create(dto, schoolId, userId);
  }

  @Get()
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'List all announcements (admin view)' })
  async findAll(@Query() query: AnnouncementQueryDto, @CurrentSchool('id') schoolId: string) {
    return this.announcementsService.findAll(query, schoolId);
  }

  @Get('published')
  @Roles(Role.HEADMASTER, Role.TEACHER, Role.PARENT)
  @ApiOperation({ summary: 'Get published announcements for current user' })
  async findPublished(@CurrentUser('id') userId: string, @CurrentUser('role') userRole: string, @CurrentSchool('id') schoolId: string) {
    return this.announcementsService.findPublished(schoolId, userId, userRole);
  }

  @Get(':id')
  @Roles(Role.HEADMASTER, Role.TEACHER, Role.PARENT)
  @ApiOperation({ summary: 'Get announcement by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.announcementsService.findOne(id, schoolId);
  }

  @Patch(':id')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Update announcement' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAnnouncementDto,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.announcementsService.update(id, dto, schoolId);
  }

  @Delete(':id')
  @Roles(Role.HEADMASTER)
  @ApiOperation({ summary: 'Delete announcement' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.announcementsService.remove(id, schoolId);
  }
}