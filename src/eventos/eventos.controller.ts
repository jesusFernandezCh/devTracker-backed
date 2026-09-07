import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { EventosService } from './eventos.service';
import { CrearEventoDto, ActualizarEventoDto } from './dto/evento.dto';
import { RequirePermiso } from '../common/decorators/permisos.decorator';
import { CurrentUser } from '../common/decorators/auth.decorators';
import type { JwtPayload } from '../common/decorators/auth.decorators';

@Controller('eventos')
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  @Get()
  @RequirePermiso('leer', 'calendario')
  findAll(@CurrentUser() user: JwtPayload) {
    return this.eventosService.findAll(user.sub);
  }

  @Post()
  @RequirePermiso('crear', 'calendario')
  crear(@Body() dto: CrearEventoDto, @CurrentUser() user: JwtPayload) {
    return this.eventosService.crear(dto, user.sub);
  }

  @Patch(':id')
  @RequirePermiso('editar', 'calendario')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarEventoDto, @CurrentUser() user: JwtPayload) {
    return this.eventosService.actualizar(id, dto, user.sub);
  }

  @Delete(':id')
  @RequirePermiso('eliminar', 'calendario')
  @HttpCode(204)
  async eliminar(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.eventosService.eliminar(id, user.sub);
  }
}
