import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { EnviarMensajeDto, MarcarLeidosDto } from './dto/chat.dto';
import { CurrentUser } from '../common/decorators/auth.decorators';
import type { JwtPayload } from '../common/decorators/auth.decorators';
import { CanalChat } from '@prisma/client';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('general')
  mensajesGeneral(@CurrentUser() user: JwtPayload) {
    return this.chatService.mensajesGeneral(user.sub);
  }

  @Get('privado/:otroId')
  mensajesPrivados(@CurrentUser() user: JwtPayload, @Param('otroId') otroId: string) {
    return this.chatService.mensajesPrivados(user.sub, otroId);
  }

  @Get('grupo/:proyectoId')
  mensajesGrupo(@CurrentUser() user: JwtPayload, @Param('proyectoId') proyectoId: string) {
    return this.chatService.mensajesGrupo(user.sub, proyectoId);
  }

  @Get('no-leidos')
  noLeidosTotal(@CurrentUser() user: JwtPayload) {
    return this.chatService.noLeidosTotal(user.sub);
  }

  @Get('no-leidos/:canal')
  noLeidosEn(
    @CurrentUser() user: JwtPayload,
    @Param('canal') canal: CanalChat,
    @Query('destinoId') destinoId?: string,
    @Query('proyectoId') proyectoId?: string,
  ) {
    return this.chatService.noLeidosEn(user.sub, canal, destinoId, proyectoId);
  }

  @Post('general')
  async enviarGeneral(@CurrentUser() user: JwtPayload, @Body() dto: EnviarMensajeDto) {
    const mensaje = await this.chatService.enviar(user.sub, { canal: 'general', texto: dto.texto });
    this.chatGateway.emitirNuevoMensaje(mensaje);
    return mensaje;
  }

  @Post('privado/:otroId')
  async enviarPrivado(
    @CurrentUser() user: JwtPayload,
    @Param('otroId') otroId: string,
    @Body() dto: EnviarMensajeDto,
  ) {
    const mensaje = await this.chatService.enviar(user.sub, {
      canal: 'privado',
      destinoId: otroId,
      texto: dto.texto,
    });
    this.chatGateway.emitirNuevoMensaje(mensaje);
    return mensaje;
  }

  @Post('grupo/:proyectoId')
  async enviarGrupo(
    @CurrentUser() user: JwtPayload,
    @Param('proyectoId') proyectoId: string,
    @Body() dto: EnviarMensajeDto,
  ) {
    const mensaje = await this.chatService.enviar(user.sub, {
      canal: 'grupo',
      proyectoId,
      texto: dto.texto,
    });
    this.chatGateway.emitirNuevoMensaje(mensaje);
    return mensaje;
  }

  @Patch('leer')
  async marcarLeidos(@CurrentUser() user: JwtPayload, @Body() dto: MarcarLeidosDto) {
    const payload = { canal: dto.canal, destinoId: dto.destinoId, proyectoId: dto.proyectoId };
    await this.chatService.marcarLeidos(user.sub, payload);
    this.chatGateway.emitirLeido(payload);
  }
}
