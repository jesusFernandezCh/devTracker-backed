import { Body, Controller, Get, HttpCode, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto, RegistroDto, VerificarEmailDto, RegistroOAuthDto } from './dto';
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
      sameSite: isProd ? ('none' as const) : ('lax' as const),
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
  @HttpCode(201)
  @Post('registro')
  async registro(@Body() dto: RegistroDto) {
    return this.authService.registro(dto);
  }

  @Public()
  @Get('verificar-email')
  async verificarEmail(@Query('token') token: string) {
    return this.authService.invitacionService.verificarToken(token);
  }

  @Public()
  @HttpCode(200)
  @Post('oauth/:proveedor/callback')
  async oauthCallback(
    @Query('proveedor') proveedor: string,
    @Body() dto: RegistroOAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const proveedoresValidos = ['google', 'github', 'facebook'];
    if (!proveedoresValidos.includes(proveedor)) {
      return res.status(400).json({ message: 'Proveedor no válido' });
    }

    const perfil = await this.obtenerPerfilOAuth(proveedor, dto.code);
    const resultado = await this.authService.registroOAuth(proveedor, perfil);

    if ('accessToken' in resultado) {
      this.setRefreshCookie(res, resultado.refreshToken);
      return { accessToken: resultado.accessToken, user: resultado.user };
    }

    return resultado;
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

  private async obtenerPerfilOAuth(
    proveedor: string,
    code: string,
  ): Promise<{ email: string; nombre: string; externalId: string }> {
    const configKey = proveedor.toUpperCase();
    const clientId = this.config.get<string>(`${configKey}_CLIENT_ID`);
    const clientSecret = this.config.get<string>(`${configKey}_CLIENT_SECRET`);

    if (!clientId || !clientSecret) {
      throw new Error(`OAuth no configurado para ${proveedor}`);
    }

    const tokenUrl = this.getTokenUrl(proveedor);
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${this.config.get<string>('API_URL') ?? 'http://localhost:3000'}/api/auth/${proveedor}/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json() as { access_token: string };
    if (!tokenData.access_token) {
      throw new Error('No se pudo obtener token de acceso');
    }

    const userInfo = await this.obtenerUserInfo(proveedor, tokenData.access_token);
    return userInfo;
  }

  private getTokenUrl(proveedor: string): string {
    switch (proveedor) {
      case 'google': return 'https://oauth2.googleapis.com/token';
      case 'github': return 'https://github.com/login/oauth/access_token';
      case 'facebook': return 'https://graph.facebook.com/v18.0/oauth/access_token';
      default: throw new Error(`Proveedor no soportado: ${proveedor}`);
    }
  }

  private async obtenerUserInfo(
    proveedor: string,
    accessToken: string,
  ): Promise<{ email: string; nombre: string; externalId: string }> {
    switch (proveedor) {
      case 'google': {
        const resp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await resp.json() as { email: string; name: string; id: string };
        return { email: data.email, nombre: data.name, externalId: data.id };
      }
      case 'github': {
        const resp = await fetch('https://api.github.com/user', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await resp.json() as { email: string; login: string; id: number };
        return { email: data.email, nombre: data.login, externalId: String(data.id) };
      }
      case 'facebook': {
        const resp = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
        const data = await resp.json() as { email: string; name: string; id: string };
        return { email: data.email, nombre: data.name, externalId: data.id };
      }
      default:
        throw new Error(`Proveedor no soportado: ${proveedor}`);
    }
  }
}
