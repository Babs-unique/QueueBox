import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { REFRESH_COOKIE_NAME } from '../constants.js';

type JwtPayload = { sub: string; email: string };

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & { cookies?: Record<string, string | undefined>; user: JwtPayload & { refreshToken: string } }
    >();
    const token = request.cookies?.[REFRESH_COOKIE_NAME];

    if (!token) throw new UnauthorizedException('Missing refresh cookie');

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      request.user = { sub: payload.sub, email: payload.email, refreshToken: token };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return true;
  }
}
