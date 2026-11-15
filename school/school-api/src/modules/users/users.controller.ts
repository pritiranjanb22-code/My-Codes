import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ApproveUserDto, UserQueryDto } from './dto/users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolScopeGuard } from '../../common/guards/school-scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentSchool } from '../../common/decorators';
import { Role, UserStatus } from '@prisma/client';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, SchoolScopeGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Create new user (teacher/parent)' })
  @ApiResponse({ status: 201, description: 'User created' })
  async create(
    @Body() dto: CreateUserDto,
    @CurrentSchool('id') schoolId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.create(dto, schoolId, userId);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'List users with filters' })
  async findAll(@Query() query: UserQueryDto, @CurrentSchool('id') schoolId: string) {
    return this.usersService.findAll(query, schoolId);
  }

  @Get('pending')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Get pending user approvals' })
  async getPending(@CurrentSchool('id') schoolId: string) {
    return this.usersService.getPendingApprovals(schoolId);
  }

  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Get user statistics' })
  async getStats(@CurrentSchool('id') schoolId: string) {
    return this.usersService.getStats(schoolId);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER, Role.TEACHER, Role.PARENT)
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.usersService.findOne(id, schoolId);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.usersService.update(id, dto, schoolId);
  }

  @Patch(':id/approve')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Approve/Reject pending user' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveUserDto,
    @CurrentUser('id') userId: string,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.usersService.approve(id, dto, userId, schoolId);
  }

  @Patch(':id/suspend')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Suspend user' })
  async suspend(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.usersService.suspend(id, schoolId);
  }

  @Patch(':id/activate')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Activate suspended user' })
  async activate(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.usersService.activate(id, schoolId);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Suspend user (soft delete)' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentSchool('id') schoolId: string) {
    return this.usersService.remove(id, schoolId);
  }
}