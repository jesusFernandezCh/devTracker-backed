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
}
