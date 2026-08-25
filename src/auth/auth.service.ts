import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from '../common/decorators/auth.decorators';
import { User, Accion, Recurso } from '@prisma/client';

export interface UsuarioPublico {
  id: string;
  usuario: string;
  correo: string;
  rolId: string;
  rol: string;
  nombres?: string | null;
  apellidos?: string | null;
  cedula?: string | null;
  telefono?: string | null;
  telefonoContacto?: string | null;
  direccion?: string | null;
  foto?: string | null;
  curriculum?: unknown;
}

const REFRESH_COOKIE = 'devtracker_refresh';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly password: PasswordService,
  ) {}

  get refreshCookieName(): string {
    return REFRESH_COOKIE;
  }

  async login(dto: LoginDto) {
    const usuario = await this.prisma.user.findUnique({
      where: { correo: dto.correo },
      include: { rol: true },
    });
    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const valida = await this.password.verify(dto.clave, usuario.claveHash);
    if (!valida) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Upgrade silencioso: las claves legacy (SHA-256/base64 del frontend) se
    // re-hashean a scrypt en el primer login correcto.
    if (this.password.esLegacy(usuario.claveHash)) {
      const nuevoHash = await this.password.hash(dto.clave);
      await this.prisma.user.update({
        where: { id: usuario.id },
        data: { claveHash: nuevoHash },
      });
      this.logger.log(`Clave legacy migrada a scrypt para ${usuario.correo}`);
    }

    return this.generarSesion(usuario);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const registro = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { rol: true } } },
    });
    if (!registro || registro.revocadoAt) {
      throw new UnauthorizedException('Sesión expirada');
    }
    if (registro.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Sesión expirada');
    }

    // Rotación: revocar el token actual y emitir uno nuevo.
    await this.prisma.refreshToken.update({
      where: { id: registro.id },
      data: { revocadoAt: new Date() },
    });

    return this.generarSesion(registro.user, [registro.id]);
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revocadoAt: null },
      data: { revocadoAt: new Date() },
    });
  }

  async me(userId: string) {
    const usuario = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { rol: true },
    });
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return {
      ...this.aPublico(usuario),
      permisos: await this.matrizPermisos(),
    };
  }

  /** Matriz completa de permisos: Record<rolId, Record<recurso, accion[]>>. */
  async matrizPermisos(): Promise<Record<string, Partial<Record<Recurso, Accion[]>>>> {
    const filas = await this.prisma.rolPermiso.findMany();
    const matriz: Record<string, Partial<Record<Recurso, Accion[]>>> = {};
    for (const { rolId, recurso, accion } of filas) {
      (matriz[rolId] ??= {});
      (matriz[rolId][recurso] ??= []).push(accion);
    }
    return matriz;
  }

  private async generarSesion(
    usuario: User & { rol: { id: string; nombre: string } },
    revocarIds: string[] = [],
  ) {
    const payload: JwtPayload = { sub: usuario.id, rolId: usuario.rolId };
    const accessToken = await this.jwt.signAsync(payload);

    const refreshToken = randomBytes(48).toString('hex');
    const ttlDias = Number(this.config.get<string>('JWT_REFRESH_TTL_DAYS') ?? 30);
    await this.prisma.refreshToken.create({
      data: {
        userId: usuario.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + ttlDias * 24 * 60 * 60 * 1000),
      },
    });

    if (revocarIds.length > 0) {
      await this.prisma.refreshToken.updateMany({
        where: { id: { in: revocarIds } },
        data: { revocadoAt: new Date() },
      });
    }

    return {
      accessToken,
      refreshToken,
      user: this.aPublico(usuario),
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private aPublico(usuario: User & { rol: { id: string; nombre: string } }): UsuarioPublico {
    return {
      id: usuario.id,
      usuario: usuario.usuario,
      correo: usuario.correo,
      rolId: usuario.rolId,
      rol: usuario.rol.nombre,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      cedula: usuario.cedula,
      telefono: usuario.telefono,
      telefonoContacto: usuario.telefonoContacto,
      direccion: usuario.direccion,
      foto: usuario.foto,
      curriculum: usuario.curriculum,
    };
  }
}
