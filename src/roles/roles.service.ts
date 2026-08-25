import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CrearRolDto, RenombrarRolDto, TogglePermisoDto } from './dto/rol.dto';
import { ROL_SUPER_ADMIN_ID } from '../constants';
import { ACCIONES, MATRIZ_DEFAULT, RECURSOS_ORDEN } from '../common/default-permisos';
import { Accion, Recurso } from '@prisma/client';

export type ResultadoEliminarRol = 'ok' | 'protegido' | 'en-uso';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const roles = await this.prisma.rol.findMany({
      orderBy: { createdAt: 'asc' },
    });
    const conteos = await this.prisma.user.groupBy({
      by: ['rolId'],
      _count: { _all: true },
    });
    const conteoMap = new Map(conteos.map((c) => [c.rolId, c._count._all]));
    return roles.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      sistema: r.sistema,
      usuarios: conteoMap.get(r.id) ?? 0,
    }));
  }

  async crear(dto: CrearRolDto) {
    const nombre = dto.nombre.trim();
    if (!nombre) throw new BadRequestException('El nombre es requerido');
    if (await this.existeNombre(nombre)) {
      throw new ConflictException('Ya existe un rol con ese nombre');
    }
    const rol = await this.prisma.rol.create({
      data: { id: randomUUID(), nombre, sistema: false },
    });
    return { id: rol.id, nombre: rol.nombre, sistema: rol.sistema, usuarios: 0 };
  }

  async renombrar(id: string, dto: RenombrarRolDto) {
    if (id === ROL_SUPER_ADMIN_ID) {
      throw new BadRequestException('El super-administrador no se renombra');
    }
    const rol = await this.prisma.rol.findUnique({ where: { id } });
    if (!rol) throw new NotFoundException('Rol no encontrado');

    const nombre = dto.nombre.trim();
    if (await this.existeNombre(nombre, id)) {
      throw new ConflictException('Ya existe un rol con ese nombre');
    }
    const actualizado = await this.prisma.rol.update({
      where: { id },
      data: { nombre },
    });
    return { id: actualizado.id, nombre: actualizado.nombre, sistema: actualizado.sistema };
  }

  async eliminar(id: string): Promise<{ resultado: ResultadoEliminarRol }> {
    if (id === ROL_SUPER_ADMIN_ID) return { resultado: 'protegido' };
    const rol = await this.prisma.rol.findUnique({ where: { id } });
    if (!rol) return { resultado: 'ok' };

    const enUso = await this.prisma.user.count({ where: { rolId: id } });
    if (enUso > 0) return { resultado: 'en-uso' };

    await this.prisma.rol.delete({ where: { id } }); // cascada a rol_permisos
    return { resultado: 'ok' };
  }

  async matriz(): Promise<Record<string, Partial<Record<Recurso, Accion[]>>>> {
    const filas = await this.prisma.rolPermiso.findMany();
    const matriz: Record<string, Partial<Record<Recurso, Accion[]>>> = {};
    for (const { rolId, recurso, accion } of filas) {
      (matriz[rolId] ??= {});
      (matriz[rolId][recurso] ??= []).push(accion);
    }
    return matriz;
  }

  async toggle(rolId: string, dto: TogglePermisoDto) {
    if (rolId === ROL_SUPER_ADMIN_ID) return;
    const rol = await this.prisma.rol.findUnique({ where: { id: rolId } });
    if (!rol) throw new NotFoundException('Rol no encontrado');

    const existe = await this.prisma.rolPermiso.findUnique({
      where: { rolId_recurso_accion: { rolId, recurso: dto.recurso, accion: dto.accion } },
    });
    if (existe) {
      await this.prisma.rolPermiso.delete({
        where: { rolId_recurso_accion: { rolId, recurso: dto.recurso, accion: dto.accion } },
      });
    } else {
      await this.prisma.rolPermiso.create({
        data: { rolId, recurso: dto.recurso, accion: dto.accion },
      });
    }
  }

  /** Restablece los roles de sistema a la matriz por defecto; conserva los roles personalizados. */
  async restablecer() {
    const roles = await this.prisma.rol.findMany();
    const existente = await this.prisma.rolPermiso.findMany();

    const porRol = new Map<string, Partial<Record<Recurso, Accion[]>>>();
    for (const { rolId, recurso, accion } of existente) {
      if (!porRol.has(rolId)) porRol.set(rolId, {});
      const actual = porRol.get(rolId)!;
      (actual[recurso] ??= []).push(accion);
    }

    await this.prisma.rolPermiso.deleteMany();

    for (const rol of roles) {
      const acciones = MATRIZ_DEFAULT[rol.id] ?? porRol.get(rol.id);
      if (!acciones) continue;
      const data: Array<{ rolId: string; recurso: Recurso; accion: Accion }> = [];
      for (const recurso of RECURSOS_ORDEN) {
        const lista = acciones[recurso] ?? [];
        for (const accion of lista) {
          if ((ACCIONES as readonly string[]).includes(accion)) {
            data.push({ rolId: rol.id, recurso, accion });
          }
        }
      }
      if (data.length > 0) {
        await this.prisma.rolPermiso.createMany({ data });
      }
    }
  }

  private async existeNombre(nombre: string, ignorarId?: string): Promise<boolean> {
    const n = nombre.toLowerCase();
    const existente = await this.prisma.rol.findMany();
    return existente.some(
      (r) => r.nombre.trim().toLowerCase() === n && r.id !== ignorarId,
    );
  }
}
