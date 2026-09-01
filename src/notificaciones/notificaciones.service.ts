import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CrearNotificacionDto } from './dto/notificacion.dto';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class NotificacionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async findAll(usuarioId: string) {
    return this.prisma.notificacion.findMany({
      where: { usuarioId },
      orderBy: { fecha: 'desc' },
    });
  }

  async noLeidas(usuarioId: string) {
    const total = await this.prisma.notificacion.count({
      where: { usuarioId, leida: false },
    });
    return { total };
  }

  async crear(usuarioId: string, dto: CrearNotificacionDto) {
    const notificacion = await this.prisma.notificacion.create({
      data: {
        id: randomUUID(),
        usuarioId,
        tipo: dto.tipo,
        descripcion: dto.descripcion,
        url: dto.url,
      },
    });
    this.chatGateway.emitirNotificacionNueva(usuarioId, notificacion);
    return notificacion;
  }

  async marcarLeida(id: string, usuarioId: string) {
    const notificacion = await this.prisma.notificacion.findFirst({
      where: { id, usuarioId },
    });
    if (!notificacion) throw new NotFoundException('Notificación no encontrada');
    return this.prisma.notificacion.update({
      where: { id },
      data: { leida: true },
    });
  }

  async marcarTodasLeidas(usuarioId: string) {
    await this.prisma.notificacion.updateMany({
      where: { usuarioId, leida: false },
      data: { leida: true },
    });
  }

  async eliminar(id: string, usuarioId: string) {
    const notificacion = await this.prisma.notificacion.findFirst({
      where: { id, usuarioId },
    });
    if (!notificacion) throw new NotFoundException('Notificación no encontrada');
    await this.prisma.notificacion.delete({ where: { id } });
  }
}
