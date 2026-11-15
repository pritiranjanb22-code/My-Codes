import { Controller, Get, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogQueryDto } from './dto/audit-logs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolScopeGuard } from '../../common/guards/school-scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentSchool, CurrentUser } from '../../common/decorators';
import { Role } from '@prisma/client';

@ApiTags('audit-logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard, SchoolScopeGuard)
@ApiBearerAuth()
export class AuditLogsController {
  constructor(private auditLogsService: AuditLogsService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'List audit logs' })
  async findAll(@Query() query: AuditLogQueryDto, @CurrentSchool('id') schoolId: string) {
    return this.auditLogsService.findAll(query, schoolId);
  }

  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Get audit log statistics' })
  async getStats(@CurrentSchool('id') schoolId: string) {
    return this.auditLogsService.getStats(schoolId);
  }

  @Get('entity/:entity/:entityId')
  @Roles(Role.SUPER_ADMIN, Role.HEADMASTER)
  @ApiOperation({ summary: 'Get audit history for specific entity' })
  async getEntityHistory(
    @Param('entity') entity: string,
    @Param('entityId') entityId: string,
    @CurrentSchool('id') schoolId: string,
  ) {
    return this.auditLogsService.getEntityHistory(entity, entityId, schoolId);
  }

  @Get('system')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get system-wide audit logs (Super Admin only)' })
  async findSystemLogs(@Query() query: AuditLogQueryDto) {
    return this.auditLogsService.findAll(query);
  }
}