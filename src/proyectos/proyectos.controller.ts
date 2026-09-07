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
import { ChatGateway } from '../chat/chat.gateway';

@Controller('proyectos')
export class ProyectosController {
  constructor(
    private readonly proyectosService: ProyectosService,
    private readonly chatGateway: ChatGateway,
  ) {}

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
  async crear(@Body() dto: CrearProyectoDto) {
    const proyecto = await this.proyectosService.crear(dto);
    this.chatGateway.emitirProyectoCreado(proyecto);
    return proyecto;
  }

  @Patch(':id')
  @RequirePermiso('editar', 'proyectos')
  async actualizar(@Param('id') id: string, @Body() dto: ActualizarProyectoDto) {
    const proyecto = await this.proyectosService.actualizar(id, dto);
    this.chatGateway.emitirProyectoActualizado(proyecto);
    return proyecto;
  }

  @Delete(':id')
  @RequirePermiso('eliminar', 'proyectos')
  @HttpCode(204)
  async eliminar(@Param('id') id: string) {
    await this.proyectosService.eliminar(id);
    this.chatGateway.emitirProyectoEliminado(id);
  }
}
