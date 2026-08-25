import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { CrearNotificacionDto } from './dto/notificacion.dto';
import { CurrentUser } from '../common/decorators/auth.decorators';
import type { JwtPayload } from '../common/decorators/auth.decorators';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.notificacionesService.findAll(user.sub);
  }

  @Get('no-leidas')
  noLeidas(@CurrentUser() user: JwtPayload) {
    return this.notificacionesService.noLeidas(user.sub);
  }

  @Post()
  crear(@CurrentUser() user: JwtPayload, @Body() dto: CrearNotificacionDto) {
    return this.notificacionesService.crear(user.sub, dto);
  }

  @Patch('leer-todas')
  @HttpCode(204)
  async marcarTodasLeidas(@CurrentUser() user: JwtPayload) {
    await this.notificacionesService.marcarTodasLeidas(user.sub);
  }

  @Patch(':id/leer')
  marcarLeida(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.notificacionesService.marcarLeida(id, user.sub);
  }

  @Delete(':id')
  @HttpCode(204)
  async eliminar(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.notificacionesService.eliminar(id, user.sub);
  }
}
