import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  ActualizarPlanningDto,
  ClonarPlanningDto,
  CrearPlanningDto,
  TareaDto,
} from './dto/planning.dto';
import { Complejidad } from '@prisma/client';

@Injectable()
export class PlaningsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.planning.findMany({
      orderBy: { fecha: 'desc' },
      include: {
        tareas: { orderBy: { orden: 'asc' } },
      },
    });
  }

  async findOne(id: string) {
    const planning = await this.prisma.planning.findUnique({
      where: { id },
      include: { tareas: { orderBy: { orden: 'asc' } } },
    });
    if (!planning) throw new NotFoundException('Planning no encontrado');
    return planning;
  }

  async crear(dto: CrearPlanningDto, usuarioId: string) {
    await this.validarProyecto(dto.proyectoId);
    return this.prisma.planning.create({
      data: {
        id: randomUUID(),
        fecha: dto.fecha,
        proyectoId: dto.proyectoId,
        descripcion: dto.descripcion,
        usuarioId,
        tareas: {
          create: this.tareasAcrear(dto.tareas ?? []),
        },
      },
      include: { tareas: { orderBy: { orden: 'asc' } } },
    });
  }

  async actualizar(id: string, dto: ActualizarPlanningDto) {
    await this.existe(id);
    return this.prisma.planning.update({
      where: { id },
      data: {
        fecha: dto.fecha,
        descripcion: dto.descripcion,
        tareas:
          dto.tareas !== undefined
            ? {
                deleteMany: {},
                create: this.tareasAcrear(dto.tareas),
              }
            : undefined,
      },
      include: { tareas: { orderBy: { orden: 'asc' } } },
    });
  }

  async eliminar(id: string) {
    await this.existe(id);
    await this.prisma.planning.delete({ where: { id } });
  }

  async clonar(id: string, dto: ClonarPlanningDto, usuarioId: string) {
    const original = await this.prisma.planning.findUnique({
      where: { id },
      include: { tareas: { orderBy: { orden: 'asc' } } },
    });
    if (!original) throw new NotFoundException('Planning no encontrado');

    const nuevoId = randomUUID();
    await this.prisma.planning.create({
      data: {
        id: nuevoId,
        fecha: dto.fecha ?? original.fecha,
        proyectoId: original.proyectoId,
        descripcion: original.descripcion,
        usuarioId,
        tareas: {
          create: original.tareas.map((t) => ({
            id: randomUUID(),
            tarea: t.tarea,
            complejidad: t.complejidad,
            completada: t.completada,
            orden: t.orden,
          })),
        },
      },
    });
    return this.findOne(nuevoId);
  }

  private tareasAcrear(tareas: TareaDto[]) {
    return tareas.map((t, index) => ({
      id: t.id ?? randomUUID(),
      tarea: t.tarea,
      complejidad: t.complejidad as Complejidad,
      completada: t.completada ?? false,
      orden: index,
    }));
  }

  private async validarProyecto(proyectoId: string) {
    const proyecto = await this.prisma.proyecto.findUnique({ where: { id: proyectoId } });
    if (!proyecto) throw new BadRequestException('Proyecto no válido');
  }

  private async existe(id: string) {
    const p = await this.prisma.planning.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Planning no encontrado');
  }
}
