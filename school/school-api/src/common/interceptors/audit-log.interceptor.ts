import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const auditLog = request.auditLog;

    if (!auditLog) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (response) => {
        try {
          await this.prisma.auditLog.create({
            data: {
              userId: request.user?.id,
              schoolId: request.school?.id || request.user?.schoolId,
              action: auditLog.action,
              entity: auditLog.entity,
              entityId: auditLog.entityId,
              oldData: auditLog.oldData,
              newData: auditLog.newData || response,
              ipAddress: auditLog.ipAddress,
              userAgent: auditLog.userAgent,
            },
          });
        } catch (error) {
          console.error('Audit log failed:', error);
        }
      }),
    );
  }
}