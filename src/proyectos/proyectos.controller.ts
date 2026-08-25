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
import { ProyectosService } from './proyectos.service';
import { ActualizarProyectoDto, CrearProyectoDto } from './dto/proyecto.dto';
import { RequirePermiso } from '../common/decorators/permisos.decorator';

@Controller('proyectos')
export class ProyectosController {
  constructor(private readonly proyectosService: ProyectosService) {}

  @Get()
  @RequirePermiso('leer', 'proyectos')
  findAll() {
    return this.proyectosService.findAll();
  }

  @Get(':id')
  @RequirePermiso('leer', 'proyectos')
  findOne(@Param('id') id: string) {
    return this.proyectosService.findOne(id);
  }

  @Post()
  @RequirePermiso('crear', 'proyectos')
  crear(@Body() dto: CrearProyectoDto) {
    return this.proyectosService.crear(dto);
  }

  @Patch(':id')
  @RequirePermiso('editar', 'proyectos')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarProyectoDto) {
    return this.proyectosService.actualizar(id, dto);
  }

  @Delete(':id')
  @RequirePermiso('eliminar', 'proyectos')
  @HttpCode(204)
  async eliminar(@Param('id') id: string) {
    await this.proyectosService.eliminar(id);
  }
}
