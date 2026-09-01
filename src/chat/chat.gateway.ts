import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { EquipoService } from '../equipo/equipo.service';
import { ROL_SUPER_ADMIN_ID } from '../constants';
import type { LeidoPayload, MensajeSerializado } from './chat.service';
import type { JwtPayload } from '../common/decorators/auth.decorators';

@WebSocketGateway({
  cors: { origin: true, credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly chatService: ChatService,
    private readonly equipoService: EquipoService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        (client.handshake.headers.authorization as string | undefined)?.replace('Bearer ', '');
      const payload = await this.jwt.verifyAsync<JwtPayload>(token ?? '', {
        secret: this.config.get<string>('JWT_ACCESS_SECRET') ?? 'dev-secret',
      });
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);

      if (payload.rolId === 'administrador' || payload.rolId === ROL_SUPER_ADMIN_ID) {
        const mapa = await this.equipoService.mapa();
        for (const proyectoId of Object.keys(mapa)) {
          client.join(`proyecto:${proyectoId}`);
        }
      }
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect() {
    /* sin acción adicional */
  }

  @SubscribeMessage('chat:unirse-proyecto')
  unirseProyecto(@ConnectedSocket() client: Socket, @MessageBody() proyectoId: string) {
    if (typeof proyectoId === 'string' && proyectoId) {
      client.join(`proyecto:${proyectoId}`);
    }
  }

  @SubscribeMessage('chat:salir-proyecto')
  salirProyecto(@ConnectedSocket() client: Socket, @MessageBody() proyectoId: string) {
    if (typeof proyectoId === 'string' && proyectoId) {
      client.leave(`proyecto:${proyectoId}`);
    }
  }

  @SubscribeMessage('chat:escribiendo')
  escribir(@ConnectedSocket() client: Socket, @MessageBody() payload: LeidoPayload) {
    this.broadcastEscribiendo(client.data.userId, payload);
  }

  /** Notifica un mensaje nuevo a los destinatarios (el autor ya lo recibe por HTTP). */
  emitirNuevoMensaje(mensaje: MensajeSerializado) {
    if (mensaje.canal === 'privado' && mensaje.destinoId) {
      this.server.to(`user:${mensaje.destinoId}`).emit('mensaje:nuevo', mensaje);
      return;
    }
    if (mensaje.canal === 'grupo' && mensaje.proyectoId) {
      this.server.to(`proyecto:${mensaje.proyectoId}`).emit('mensaje:nuevo', mensaje);
      return;
    }
    this.server.emit('mensaje:nuevo', mensaje);
  }

  /** Notifica marcado de leído para que el emisor actualice contadores. */
  emitirLeido(payload: LeidoPayload) {
    if (payload.canal === 'privado' && payload.destinoId) {
      this.server.to(`user:${payload.destinoId}`).emit('chat:leido', payload);
      return;
    }
    this.server.emit('chat:leido', payload);
  }

  private broadcastEscribiendo(autorId: string, payload: LeidoPayload) {
    const evento = { autorId, ...payload };
    if (payload.canal === 'privado' && payload.destinoId) {
      this.server.to(`user:${payload.destinoId}`).emit('chat:escribiendo', evento);
      return;
    }
    this.server.emit('chat:escribiendo', evento);
  }

  /** Notifica a todos los clientes que el equipo de un proyecto cambió. */
  emitirEquipoCambiado(proyectoId: string, usuarioIds: string[], usuarioAgregado?: string) {
    this.server.emit('equipo:cambiado', { proyectoId, usuarioIds, usuarioAgregado });
  }

  /** Notifica a un usuario específico que tiene una notificación nueva. */
  emitirNotificacionNueva(usuarioId: string, notificacion: unknown) {
    this.server.to(`user:${usuarioId}`).emit('notificacion:nueva', notificacion);
  }

  // ─── Tablero / Proyectos / Columnas ────────────────────────────

  emitirProyectoCreado(proyecto: unknown) {
    this.server.emit('tablero:proyecto-creado', proyecto);
  }

  emitirProyectoActualizado(proyecto: unknown) {
    this.server.emit('tablero:proyecto-actualizado', proyecto);
  }

  emitirProyectoEliminado(proyectoId: string) {
    this.server.emit('tablero:proyecto-eliminado', { id: proyectoId });
  }

  emitirColumnaCreada(columna: unknown) {
    this.server.emit('tablero:columna-creada', columna);
  }

  emitirColumnaActualizada(columna: unknown) {
    this.server.emit('tablero:columna-actualizada', columna);
  }

  emitirColumnaEliminada(columnaId: string) {
    this.server.emit('tablero:columna-eliminada', { id: columnaId });
  }

  emitirColumnasReordenadas(columnas: unknown[]) {
    this.server.emit('tablero:columnas-reordenadas', columnas);
  }

  // ─── Plannings / Tareas ────────────────────────────────────────

  emitirPlanningCreado(planning: unknown, proyectoId: string) {
    this.server.to(`proyecto:${proyectoId}`).emit('planning:creado', planning);
  }

  emitirPlanningActualizado(planning: unknown, proyectoId: string) {
    this.server.to(`proyecto:${proyectoId}`).emit('planning:actualizado', planning);
  }

  emitirPlanningEliminado(planningId: string, proyectoId: string) {
    this.server.to(`proyecto:${proyectoId}`).emit('planning:eliminado', { id: planningId });
  }
}
