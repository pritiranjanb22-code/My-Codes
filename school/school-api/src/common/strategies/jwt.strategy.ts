import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { User, Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  schoolId?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'super-secret-change-in-production',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<User & { school?: { id: string; status: string } }> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { school: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    if (user.school && user.school.status !== 'ACTIVE') {
      throw new UnauthorizedException('School is not active');
    }

    if (user.refreshToken !== req.headers['authorization']?.replace('Bearer ', '')) {
      throw new UnauthorizedException('Token revoked');
    }

    return user;
  }
}