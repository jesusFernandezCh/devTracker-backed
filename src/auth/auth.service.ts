import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';
import { LoginDto, RegistroDto } from './dto';
import { InvitacionService } from './invitacion.service';
import type { JwtPayload } from '../common/decorators/auth.decorators';
import { User, Accion, Recurso } from '@prisma/client';

export interface UsuarioPublico {
  id: string;
  usuario: string;
  correo: string;
  rolId: string;
  rol: string;
  estatus: string;
  proveedor?: string | null;
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
    readonly invitacionService: InvitacionService,
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

    if (usuario.estatus === 'pendiente') {
      throw new UnauthorizedException('Tu cuenta está pendiente de verificación por un administrador');
    }
    if (usuario.estatus === 'suspendido') {
      throw new UnauthorizedException('Tu cuenta ha sido suspendida. Contacta al administrador');
    }

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

  async registro(dto: RegistroDto) {
    if (dto.clave !== dto.claveConfirmacion) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const existeUsuario = await this.prisma.user.findFirst({
      where: { usuario: dto.usuario },
    });
    if (existeUsuario) {
      throw new BadRequestException('El nombre de usuario ya está en uso');
    }

    const existeCorreo = await this.prisma.user.findUnique({
      where: { correo: dto.correo },
    });
    if (existeCorreo) {
      throw new BadRequestException('El correo ya está registrado');
    }

    let rolId = 'usuario';
    if (dto.token) {
      const invitacion = await this.invitacionService.verificarToken(dto.token);
      if (invitacion.correo.toLowerCase() !== dto.correo.toLowerCase()) {
        throw new BadRequestException('El correo no coincide con la invitación');
      }
      if (invitacion.rolId) {
        rolId = invitacion.rolId;
      }
    }

    const rol = await this.prisma.rol.findUnique({ where: { id: rolId } });
    if (!rol) {
      throw new BadRequestException('Rol no válido');
    }

    const usuario = await this.prisma.user.create({
      data: {
        id: randomUUID(),
        usuario: dto.usuario,
        correo: dto.correo,
        claveHash: await this.password.hash(dto.clave),
        rolId,
        estatus: 'pendiente',
      },
      include: { rol: true },
    });

    if (dto.token) {
      await this.invitacionService.marcarUsado(dto.token);
    }

    this.logger.log(`Nuevo usuario registrado: ${usuario.correo} (pendiente de verificación)`);

    return {
      mensaje: 'Registro exitoso. Tu cuenta está pendiente de verificación por un administrador.',
      correo: usuario.correo,
    };
  }

  async registroOAuth(proveedor: string, perfil: { email: string; nombre: string; externalId: string }) {
    let usuario = await this.prisma.user.findFirst({
      where: {
        correo: perfil.email,
      },
      include: { rol: true },
    });

    if (usuario) {
      if (!usuario.proveedor) {
        throw new BadRequestException('Este correo ya está registrado con contraseña. Inicia sesión con tu contraseña.');
      }
      if (usuario.estatus === 'pendiente') {
        throw new BadRequestException('Tu cuenta está pendiente de verificación por un administrador');
      }
      if (usuario.estatus === 'suspendido') {
        throw new BadRequestException('Tu cuenta ha sido suspendida');
      }
      return this.generarSesion(usuario);
    }

    const nombreLimpio = perfil.nombre.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'usuario';
    let nombreUsuario = nombreLimpio;
    let contador = 1;
    while (await this.prisma.user.findFirst({ where: { usuario: nombreUsuario } })) {
      nombreUsuario = `${nombreLimpio}${contador}`;
      contador++;
    }

    usuario = await this.prisma.user.create({
      data: {
        id: randomUUID(),
        usuario: nombreUsuario,
        correo: perfil.email,
        claveHash: await this.password.hash(randomBytes(32).toString('hex')),
        rolId: 'usuario',
        estatus: 'pendiente',
        proveedor,
        usuarioExternoId: perfil.externalId,
        nombres: perfil.nombre,
      },
      include: { rol: true },
    });

    this.logger.log(`Usuario OAuth registrado: ${usuario.correo} via ${proveedor} (pendiente)`);

    return {
      mensaje: 'Registro exitoso. Tu cuenta está pendiente de verificación por un administrador.',
      correo: usuario.correo,
    };
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
    if (registro.user.estatus !== 'activo') {
      throw new UnauthorizedException('Cuenta no activa');
    }

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
      permisos: await this.matrizDelUsuario(usuario.rolId),
    };
  }

  async matrizDelUsuario(rolId: string): Promise<Partial<Record<Recurso, Accion[]>>> {
    const filas = await this.prisma.rolPermiso.findMany({ where: { rolId } });
    const permisos: Partial<Record<Recurso, Accion[]>> = {};
    for (const { recurso, accion } of filas) {
      (permisos[recurso] ??= []).push(accion);
    }
    return permisos;
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
      estatus: usuario.estatus,
      proveedor: usuario.proveedor,
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
