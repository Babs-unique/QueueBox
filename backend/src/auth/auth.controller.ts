import { Controller, Get, Post, Body, Patch, Param, Delete, Res, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service.js';
import { userDtos, loginDtos, updateUserDtos } from './dto/user.dto.js';
import { AuthGuard } from './guards/auth.guard.js';
import { RefreshTokenGuard } from './guards/refresh-token.guard.js';
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from './constants.js';

// The type structure you provided
type AuthenticatedRequest = Request & {
  user: {
    sub: string;
    email: string;
  };
};

// Intersection type adding the runtime refresh token string extracted by the RefreshTokenGuard
type RefreshAuthenticatedRequest = AuthenticatedRequest & {
  user: {
    refreshToken: string;
  };
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  private setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie(AUTH_COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  @Post('register')
  signUp(@Body() dto: userDtos) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async logIn(@Body() dto: loginDtos, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.logIn(dto);
    this.setTokenCookies(res, result.accessToken, result.refreshToken);
    return { message: 'Successfully logged in', user: result.user };
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refresh(@Req() req: RefreshAuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.refreshTokens(req.user.sub, req.user.refreshToken);
    this.setTokenCookies(res, result.accessToken, result.refreshToken);
    return { message: 'Tokens refreshed successfully' };
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async logOut(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    await this.authService.logOut(req.user.sub);
    res.clearCookie(AUTH_COOKIE_NAME);
    res.clearCookie(REFRESH_COOKIE_NAME);
    return { message: 'Successfully logged out' };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    return this.authService.me(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: updateUserDtos) {
    return this.authService.updateUser(id, updateAuthDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }
}
