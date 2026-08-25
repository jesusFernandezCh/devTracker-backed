import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { EquipoService } from './equipo.service';
import { EstablecerEquipoDto } from './dto/equipo.dto';
import { RequirePermiso } from '../common/decorators/permisos.decorator';

@Controller('equipo')
export class EquipoController {
  constructor(private readonly equipoService: EquipoService) {}

  @Get()
  @RequirePermiso('leer', 'proyectos')
  mapa() {
    return this.equipoService.mapa();
  }

  @Get('proyectos/:usuarioId')
  @RequirePermiso('leer', 'proyectos')
  proyectosDe(@Param('usuarioId') usuarioId: string) {
    return this.equipoService.proyectosDe(usuarioId);
  }

  @Get('proyecto/:proyectoId')
  @RequirePermiso('leer', 'proyectos')
  miembrosDe(@Param('proyectoId') proyectoId: string) {
    return this.equipoService.miembrosDe(proyectoId);
  }

  @Put('proyecto/:proyectoId')
  @RequirePermiso('editar', 'proyectos')
  establecer(@Param('proyectoId') proyectoId: string, @Body() dto: EstablecerEquipoDto) {
    return this.equipoService.establecer(proyectoId, dto.usuarioIds);
  }

  @Post('proyecto/:proyectoId/:usuarioId')
  @RequirePermiso('editar', 'proyectos')
  asignar(@Param('proyectoId') proyectoId: string, @Param('usuarioId') usuarioId: string) {
    return this.equipoService.asignar(proyectoId, usuarioId);
  }

  @Delete('proyecto/:proyectoId/:usuarioId')
  @RequirePermiso('editar', 'proyectos')
  @HttpCode(204)
  async quitar(@Param('proyectoId') proyectoId: string, @Param('usuarioId') usuarioId: string) {
    await this.equipoService.quitar(proyectoId, usuarioId);
  }
}
