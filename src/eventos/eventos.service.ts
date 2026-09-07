import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearEventoDto, ActualizarEventoDto } from './dto/evento.dto';

@Injectable()
export class EventosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(usuarioId: string) {
    return this.prisma.eventoCalendario.findMany({
      where: { usuarioId },
      orderBy: { fechaInicio: 'asc' },
    });
  }

  async crear(dto: CrearEventoDto, usuarioId: string) {
    return this.prisma.eventoCalendario.create({
      data: {
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        fechaInicio: new Date(dto.fechaInicio),
        fechaFin: new Date(dto.fechaFin),
        todoElDia: dto.todoElDia ?? true,
        categoria: dto.categoria ?? 'general',
        color: dto.color ?? '#6366F1',
        usuarioId,
      },
    });
  }

  async actualizar(id: string, dto: ActualizarEventoDto, usuarioId: string) {
    const evento = await this.prisma.eventoCalendario.findUnique({ where: { id } });
    if (!evento) throw new NotFoundException('Evento no encontrado');
    if (evento.usuarioId !== usuarioId) throw new NotFoundException('Evento no encontrado');

    return this.prisma.eventoCalendario.update({
      where: { id },
      data: {
        ...(dto.titulo !== undefined && { titulo: dto.titulo }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
        ...(dto.fechaInicio !== undefined && { fechaInicio: new Date(dto.fechaInicio) }),
        ...(dto.fechaFin !== undefined && { fechaFin: new Date(dto.fechaFin) }),
        ...(dto.todoElDia !== undefined && { todoElDia: dto.todoElDia }),
        ...(dto.categoria !== undefined && { categoria: dto.categoria }),
        ...(dto.color !== undefined && { color: dto.color }),
      },
    });
  }

  async eliminar(id: string, usuarioId: string) {
    const evento = await this.prisma.eventoCalendario.findUnique({ where: { id } });
    if (!evento) throw new NotFoundException('Evento no encontrado');
    if (evento.usuarioId !== usuarioId) throw new NotFoundException('Evento no encontrado');
    await this.prisma.eventoCalendario.delete({ where: { id } });
  }
}
