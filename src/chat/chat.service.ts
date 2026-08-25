import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CanalChat, Mensaje } from '@prisma/client';

interface EnviarData {
  canal: CanalChat;
  texto: string;
  destinoId?: string;
  proyectoId?: string;
}

export interface MensajeSerializado {
  id: string;
  canal: CanalChat;
  autorId: string;
  destinoId: string | null;
  proyectoId: string | null;
  texto: string;
  fecha: Date;
  leido: boolean;
}

export interface LeidoPayload {
  canal: CanalChat;
  destinoId?: string;
  proyectoId?: string;
}

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async enviar(autorId: string, data: EnviarData): Promise<MensajeSerializado> {
    const texto = data.texto.trim();
    if (!texto) throw new BadRequestException('El mensaje no puede estar vacío');

    if (data.canal === 'privado' && !data.destinoId) {
      throw new BadRequestException('El mensaje privado requiere destinoId');
    }
    if (data.canal === 'grupo' && !data.proyectoId) {
      throw new BadRequestException('El mensaje de grupo requiere proyectoId');
    }
    if (data.canal === 'privado') {
      const destino = await this.prisma.user.findUnique({ where: { id: data.destinoId } });
      if (!destino) throw new BadRequestException('Destinatario no válido');
    }
    if (data.canal === 'grupo') {
      const proyecto = await this.prisma.proyecto.findUnique({ where: { id: data.proyectoId } });
      if (!proyecto) throw new BadRequestException('Proyecto no válido');
    }

    const mensaje = await this.prisma.mensaje.create({
      data: {
        id: randomUUID(),
        canal: data.canal,
        autorId,
        destinoId: data.destinoId,
        proyectoId: data.proyectoId,
        texto,
      },
    });
    return { ...mensaje, leido: false };
  }

  async mensajesGeneral(yoId: string): Promise<MensajeSerializado[]> {
    return this.serializar(
      await this.prisma.mensaje.findMany({
        where: { canal: 'general' },
        orderBy: { fecha: 'asc' },
      }),
      yoId,
    );
  }

  async mensajesPrivados(yoId: string, otroId: string): Promise<MensajeSerializado[]> {
    return this.serializar(
      await this.prisma.mensaje.findMany({
        where: {
          canal: 'privado',
          OR: [
            { autorId: yoId, destinoId: otroId },
            { autorId: otroId, destinoId: yoId },
          ],
        },
        orderBy: { fecha: 'asc' },
      }),
      yoId,
    );
  }

  async mensajesGrupo(yoId: string, proyectoId: string): Promise<MensajeSerializado[]> {
    return this.serializar(
      await this.prisma.mensaje.findMany({
        where: { canal: 'grupo', proyectoId },
        orderBy: { fecha: 'asc' },
      }),
      yoId,
    );
  }

  async noLeidosTotal(yoId: string): Promise<{ total: number }> {
    const total = await this.prisma.mensaje.count({
      where: {
        autorId: { not: yoId },
        lecturas: { none: { usuarioId: yoId } },
        OR: [{ canal: 'general' }, { destinoId: yoId }, { canal: 'grupo' }],
      },
    });
    return { total };
  }

  async noLeidosEn(
    yoId: string,
    canal: CanalChat,
    destinoId?: string,
    proyectoId?: string,
  ): Promise<{ total: number }> {
    const where =
      canal === 'general'
        ? { canal: 'general' as const, autorId: { not: yoId } }
        : canal === 'privado'
          ? {
              canal: 'privado' as const,
              autorId: destinoId ?? '',
              destinoId: yoId,
            }
          : { canal: 'grupo' as const, proyectoId, autorId: { not: yoId } };

    const total = await this.prisma.mensaje.count({
      where: { ...where, lecturas: { none: { usuarioId: yoId } } },
    });
    return { total };
  }

  async marcarLeidos(yoId: string, data: LeidoPayload): Promise<void> {
    const mensajes = await this.prisma.mensaje.findMany({
      where: {
        canal: data.canal,
        autorId: { not: yoId },
        ...(data.canal === 'privado' ? { destinoId: yoId } : {}),
        ...(data.canal === 'grupo' ? { proyectoId: data.proyectoId } : {}),
        lecturas: { none: { usuarioId: yoId } },
      },
    });
    if (mensajes.length === 0) return;
    await this.prisma.mensajeLeido.createMany({
      data: mensajes.map((m) => ({ mensajeId: m.id, usuarioId: yoId })),
      skipDuplicates: true,
    });
  }

  private async serializar(mensajes: Mensaje[], yoId: string): Promise<MensajeSerializado[]> {
    const ids = mensajes.map((m) => m.id);
    const leidos = await this.prisma.mensajeLeido.findMany({
      where: { mensajeId: { in: ids }, usuarioId: yoId },
    });
    const leidosSet = new Set(leidos.map((l) => l.mensajeId));
    return mensajes.map((m) => ({ ...m, leido: leidosSet.has(m.id) }));
  }
}
