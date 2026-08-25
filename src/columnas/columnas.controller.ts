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
import { ColumnasService } from './columnas.service';
import {
  ActualizarColumnaDto,
  CrearColumnaDto,
  ReordenarColumnasDto,
} from './dto/columna.dto';
import { RequirePermiso } from '../common/decorators/permisos.decorator';

@Controller('columnas')
export class ColumnasController {
  constructor(private readonly columnasService: ColumnasService) {}

  @Get()
  @RequirePermiso('leer', 'tablero')
  findAll() {
    return this.columnasService.findAll();
  }

  @Post()
  @RequirePermiso('crear', 'tablero')
  crear(@Body() dto: CrearColumnaDto) {
    return this.columnasService.crear(dto);
  }

  @Patch('reordenar')
  @RequirePermiso('editar', 'tablero')
  reordenar(@Body() dto: ReordenarColumnasDto) {
    return this.columnasService.reordenar(dto);
  }

  @Patch(':id')
  @RequirePermiso('editar', 'tablero')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarColumnaDto) {
    return this.columnasService.actualizar(id, dto);
  }

  @Delete(':id')
  @RequirePermiso('eliminar', 'tablero')
  @HttpCode(204)
  async eliminar(@Param('id') id: string) {
    await this.columnasService.eliminar(id);
  }
}
