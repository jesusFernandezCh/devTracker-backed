import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarProyectoDto, CrearProyectoDto } from './dto/proyecto.dto';

@Injectable()
export class ProyectosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const proyectos = await this.prisma.proyecto.findMany({
      orderBy: { createdAt: 'asc' },
      include: { columna: true, canalArea: true },
    });
    return proyectos.map((p) => this.aProyecto(p));
  }

  async findOne(id: string) {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id },
      include: { columna: true, equipos: true, canalArea: true },
    });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
    return {
      ...this.aProyecto(proyecto),
      equipo: proyecto.equipos.map((e) => e.usuarioId),
    };
  }

  async crear(dto: CrearProyectoDto) {
    await this.validarColumna(dto.columnaId);
    const proyecto = await this.prisma.proyecto.create({
      data: {
        id: randomUUID(),
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        cliente: dto.cliente,
        canalAreaId: dto.canalAreaId || null,
        status: dto.status,
        prioridad: dto.prioridad,
        columnaId: dto.columnaId,
        fechaDesde: dto.fechaDesde,
        fechaHasta: dto.fechaHasta,
        documentacion: dto.documentacion,
      },
      include: { columna: true, canalArea: true },
    });
    return this.aProyecto(proyecto);
  }

  async actualizar(id: string, dto: ActualizarProyectoDto) {
    await this.existe(id);
    if (dto.columnaId) await this.validarColumna(dto.columnaId);
    const proyecto = await this.prisma.proyecto.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        cliente: dto.cliente,
        canalAreaId: dto.canalAreaId !== undefined ? (dto.canalAreaId || null) : undefined,
        status: dto.status,
        prioridad: dto.prioridad,
        columnaId: dto.columnaId,
        fechaDesde: dto.fechaDesde,
        fechaHasta: dto.fechaHasta,
        documentacion: dto.documentacion,
      },
      include: { columna: true, canalArea: true },
    });
    return this.aProyecto(proyecto);
  }

  async eliminar(id: string) {
    await this.existe(id);
    await this.prisma.proyecto.delete({ where: { id } });
  }

  private aProyecto(p: {
    id: string;
    nombre: string;
    descripcion: string | null;
    cliente: string | null;
    canalAreaId: string | null;
    canalArea: { id: string; nombre: string } | null;
    status: string | null;
    prioridad: string | null;
    columnaId: string;
    fechaDesde: string | null;
    fechaHasta: string | null;
    documentacion: string | null;
    createdAt: Date;
    columna: { id: string; nombre: string; orden: number; color: string };
  }) {
    return {
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion ?? undefined,
      cliente: p.cliente ?? undefined,
      canalAreaId: p.canalAreaId ?? undefined,
      canalAreaNombre: p.canalArea?.nombre ?? undefined,
      status: p.status ?? undefined,
      prioridad: p.prioridad ?? undefined,
      columnaId: p.columnaId,
      columna: p.columna.nombre,
      fechaDesde: p.fechaDesde ?? undefined,
      fechaHasta: p.fechaHasta ?? undefined,
      documentacion: p.documentacion ?? undefined,
      createdAt: p.createdAt,
    };
  }

  private async validarColumna(columnaId: string) {
    const columna = await this.prisma.columna.findUnique({ where: { id: columnaId } });
    if (!columna) throw new BadRequestException('Columna no válida');
  }

  private async existe(id: string) {
    const p = await this.prisma.proyecto.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Proyecto no encontrado');
  }
}
