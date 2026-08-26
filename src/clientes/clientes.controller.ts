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
import { ClientesService } from './clientes.service';
import { CrearClienteDto, ActualizarClienteDto } from './dto/cliente.dto';
import { RequirePermiso } from '../common/decorators/permisos.decorator';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  @RequirePermiso('leer', 'proyectos')
  findAll() {
    return this.clientesService.findAll();
  }

  @Post()
  @RequirePermiso('crear', 'proyectos')
  crear(@Body() dto: CrearClienteDto) {
    return this.clientesService.crear(dto);
  }

  @Patch(':id')
  @RequirePermiso('editar', 'proyectos')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarClienteDto) {
    return this.clientesService.actualizar(id, dto);
  }

  @Delete(':id')
  @RequirePermiso('eliminar', 'proyectos')
  @HttpCode(204)
  async eliminar(@Param('id') id: string) {
    await this.clientesService.eliminar(id);
  }
}
