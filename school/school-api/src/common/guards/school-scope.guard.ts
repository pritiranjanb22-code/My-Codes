import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SchoolScopeGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role === 'SUPER_ADMIN') {
      const schoolId = request.params.schoolId || request.body.schoolId || request.query.schoolId;
      if (schoolId) {
        const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
        if (!school) {
          throw new NotFoundException('School not found');
        }
        request.school = school;
      }
      return true;
    }

    if (!user.schoolId) {
      throw new ForbiddenException('User not associated with a school');
    }

    const schoolId = request.params.schoolId || request.body.schoolId || request.query.schoolId;
    if (schoolId && schoolId !== user.schoolId) {
      throw new ForbiddenException('Access denied to this school');
    }

    const school = await this.prisma.school.findUnique({ where: { id: user.schoolId } });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    if (school.status !== 'ACTIVE') {
      throw new ForbiddenException('School is not active');
    }

    request.school = school;
    return true;
  }
}