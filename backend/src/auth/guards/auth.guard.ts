import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AUTH_COOKIE_NAME } from '../constants.js';

type JwtPayload = { sub: string; email: string };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & { cookies?: Record<string, string | undefined>; user: JwtPayload }
    >();
    const token = request.cookies?.[AUTH_COOKIE_NAME];

    if (!token) throw new UnauthorizedException('Missing authentication cookie');

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      if (!payload.sub || !payload.email) throw new UnauthorizedException('Invalid token payload');

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true },
      });

      if (!user) throw new UnauthorizedException('User no longer exists');

      request.user = { sub: user.id, email: user.email };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }
}
