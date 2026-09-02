import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/password.service';
import { EmailService } from '../auth/email.service';
import { CrearUsuarioDto, ActualizarUsuarioDto } from './dto/usuario.dto';
import { ROL_SUPER_ADMIN_ID } from '../constants';

const SUPER_ADMIN_USER_ID = 'super-admin';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly emailService: EmailService,
  ) {}

  async findAll() {
    const usuarios = await this.prisma.user.findMany({
      orderBy: { usuario: 'asc' },
      include: { rol: true },
    });
    return usuarios.map((u) => this.aPublico(u));
  }

  async findOne(id: string) {
    const usuario = await this.prisma.user.findUnique({
      where: { id },
      include: { rol: true },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return this.aPublico(usuario);
  }

  async crear(dto: CrearUsuarioDto) {
    await this.validarRol(dto.rolId);
    await this.validarUnicos({ usuario: dto.usuario, correo: dto.correo });

    const usuario = await this.prisma.user.create({
      data: {
        id: randomUUID(),
        usuario: dto.usuario,
        correo: dto.correo,
        claveHash: await this.password.hash(dto.clave),
        rolId: dto.rolId,
        estatus: 'activo',
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        cedula: dto.cedula,
        telefono: dto.telefono,
        telefonoContacto: dto.telefonoContacto,
        direccion: dto.direccion,
        foto: dto.foto,
        curriculum: dto.curriculum as object | undefined,
      },
      include: { rol: true },
    });
    return this.aPublico(usuario);
  }

  async actualizar(id: string, dto: ActualizarUsuarioDto) {
    const actual = await this.prisma.user.findUnique({ where: { id } });
    if (!actual) throw new NotFoundException('Usuario no encontrado');

    if (dto.rolId) await this.validarRol(dto.rolId);
    if (dto.usuario || dto.correo) {
      await this.validarUnicos(
        { usuario: dto.usuario, correo: dto.correo },
        id,
      );
    }

    const claveHash = dto.clave ? await this.password.hash(dto.clave) : undefined;

    const usuario = await this.prisma.user.update({
      where: { id },
      data: {
        usuario: dto.usuario,
        correo: dto.correo,
        claveHash,
        rolId: dto.rolId,
        estatus: dto.estatus as any,
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        cedula: dto.cedula,
        telefono: dto.telefono,
        telefonoContacto: dto.telefonoContacto,
        direccion: dto.direccion,
        foto: dto.foto,
        curriculum: dto.curriculum as object | undefined,
      },
      include: { rol: true },
    });

    if (dto.estatus === 'activo' && actual.estatus !== 'activo') {
      await this.emailService.enviarBienvenida(usuario.correo, usuario.usuario);
    }

    return this.aPublico(usuario);
  }

  async aprobar(id: string, rolId: string) {
    await this.validarRol(rolId);
    const actual = await this.prisma.user.findUnique({ where: { id } });
    if (!actual) throw new NotFoundException('Usuario no encontrado');
    if (actual.estatus === 'activo') {
      throw new BadRequestException('El usuario ya está activo');
    }

    const usuario = await this.prisma.user.update({
      where: { id },
      data: { estatus: 'activo', rolId },
      include: { rol: true },
    });

    await this.emailService.enviarBienvenida(usuario.correo, usuario.usuario);

    return this.aPublico(usuario);
  }

  async eliminar(id: string, actorId: string) {
    if (id === actorId) {
      throw new BadRequestException('No puedes eliminar tu propio usuario');
    }
    if (id === SUPER_ADMIN_USER_ID) {
      throw new BadRequestException('El usuario super-admin no se puede eliminar');
    }
    await this.prisma.user.delete({ where: { id } });
  }

  private async validarRol(rolId: string) {
    const rol = await this.prisma.rol.findUnique({ where: { id: rolId } });
    if (!rol) throw new BadRequestException('Rol no válido');
  }

  private async validarUnicos(
    datos: { usuario?: string; correo?: string },
    ignorarId?: string,
  ) {
    if (datos.usuario) {
      const existe = await this.prisma.user.findFirst({
        where: { usuario: datos.usuario, NOT: { id: ignorarId ?? '' } },
      });
      if (existe) throw new ConflictException('El usuario ya existe');
    }
    if (datos.correo) {
      const existe = await this.prisma.user.findFirst({
        where: { correo: datos.correo, NOT: { id: ignorarId ?? '' } },
      });
      if (existe) throw new ConflictException('El correo ya está en uso');
    }
  }

  private aPublico(u: {
    id: string;
    usuario: string;
    correo: string;
    rolId: string;
    estatus: string;
    proveedor: string | null;
    nombres: string | null;
    apellidos: string | null;
    cedula: string | null;
    telefono: string | null;
    telefonoContacto: string | null;
    direccion: string | null;
    foto: string | null;
    curriculum: unknown;
    createdAt: Date;
    rol: { id: string; nombre: string };
  }) {
    return {
      id: u.id,
      usuario: u.usuario,
      correo: u.correo,
      rolId: u.rolId,
      rol: u.rol.nombre,
      estatus: u.estatus,
      proveedor: u.proveedor,
      nombres: u.nombres,
      apellidos: u.apellidos,
      cedula: u.cedula,
      telefono: u.telefono,
      telefonoContacto: u.telefonoContacto,
      direccion: u.direccion,
      foto: u.foto,
      curriculum: u.curriculum,
      createdAt: u.createdAt,
      esSuperAdmin: u.rolId === ROL_SUPER_ADMIN_ID,
    };
  }
}
