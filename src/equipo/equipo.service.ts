import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EquipoService {
  constructor(private readonly prisma: PrismaService) {}

  /** Mapa completo proyecto → ids de usuarios (para EquipoService del frontend). */
  async mapa(): Promise<Record<string, string[]>> {
    const filas = await this.prisma.equipoProyecto.findMany();
    const mapa: Record<string, string[]> = {};
    for (const { proyectoId, usuarioId } of filas) {
      (mapa[proyectoId] ??= []).push(usuarioId);
    }
    return mapa;
  }

  async miembrosDe(proyectoId: string): Promise<string[]> {
    const filas = await this.prisma.equipoProyecto.findMany({
      where: { proyectoId },
    });
    return filas.map((f) => f.usuarioId);
  }

  async proyectosDe(usuarioId: string): Promise<string[]> {
    const filas = await this.prisma.equipoProyecto.findMany({
      where: { usuarioId },
    });
    return filas.map((f) => f.proyectoId);
  }

  async asignar(proyectoId: string, usuarioId: string) {
    await this.validarExistencias(proyectoId, usuarioId);
    await this.prisma.equipoProyecto.upsert({
      where: { proyectoId_usuarioId: { proyectoId, usuarioId } },
      create: { proyectoId, usuarioId },
      update: {},
    });
    return this.miembrosDe(proyectoId);
  }

  async quitar(proyectoId: string, usuarioId: string) {
    await this.prisma.equipoProyecto.deleteMany({
      where: { proyectoId, usuarioId },
    });
    return this.miembrosDe(proyectoId);
  }

  async establecer(proyectoId: string, usuarioIds: string[]) {
    for (const usuarioId of usuarioIds) {
      await this.validarExistencias(proyectoId, usuarioId);
    }
    await this.prisma.$transaction([
      this.prisma.equipoProyecto.deleteMany({ where: { proyectoId } }),
      this.prisma.equipoProyecto.createMany({
        data: usuarioIds.map((usuarioId) => ({ proyectoId, usuarioId })),
      }),
    ]);
    return this.miembrosDe(proyectoId);
  }

  private async validarExistencias(proyectoId: string, usuarioId: string) {
    const [proyecto, usuario] = await Promise.all([
      this.prisma.proyecto.findUnique({ where: { id: proyectoId } }),
      this.prisma.user.findUnique({ where: { id: usuarioId } }),
    ]);
    if (!proyecto) throw new BadRequestException('Proyecto no válido');
    if (!usuario) throw new BadRequestException('Usuario no válido');
  }
}
