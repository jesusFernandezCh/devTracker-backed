import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CurrentUser, Public } from '../common/decorators/auth.decorators';
import type { JwtPayload } from '../common/decorators/auth.decorators';

const COOKIE_MAX_AGE_MS = (dias: number) => dias * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  private cookieOptions(ttlDias: number) {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: COOKIE_MAX_AGE_MS(ttlDias),
    };
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    const ttlDias = Number(this.config.get<string>('JWT_REFRESH_TTL_DAYS') ?? 30);
    res.cookie(this.authService.refreshCookieName, refreshToken, this.cookieOptions(ttlDias));
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const sesion = await this.authService.login(dto);
    this.setRefreshCookie(res, sesion.refreshToken);
    return { accessToken: sesion.accessToken, user: sesion.user };
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[this.authService.refreshCookieName] as string | undefined;
    if (!token) {
      return { accessToken: null, user: null };
    }
    const sesion = await this.authService.refresh(token);
    this.setRefreshCookie(res, sesion.refreshToken);
    return { accessToken: sesion.accessToken, user: sesion.user };
  }

  @Public()
  @HttpCode(204)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[this.authService.refreshCookieName] as string | undefined;
    if (token) {
      await this.authService.logout(token);
    }
    res.clearCookie(this.authService.refreshCookieName, { path: '/' });
  }

  @Get('me')
  async me(@CurrentUser() user: JwtPayload) {
    return this.authService.me(user.sub);
  }
}
