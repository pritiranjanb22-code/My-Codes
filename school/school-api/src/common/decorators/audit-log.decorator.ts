import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuditLogContext {
  action: string;
  entity: string;
  entityId: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}

export const AuditLog = createParamDecorator(
  (data: AuditLogContext, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    request.auditLog = {
      ...data,
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    };
    return request.auditLog;
  },
);