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
import { ChatGateway } from '../chat/chat.gateway';

@Controller('columnas')
export class ColumnasController {
  constructor(
    private readonly columnasService: ColumnasService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get()
  @RequirePermiso('leer', 'tablero')
  findAll() {
    return this.columnasService.findAll();
  }

  @Post()
  @RequirePermiso('crear', 'tablero')
  async crear(@Body() dto: CrearColumnaDto) {
    const columna = await this.columnasService.crear(dto);
    this.chatGateway.emitirColumnaCreada(columna);
    return columna;
  }

  @Patch('reordenar')
  @RequirePermiso('editar', 'tablero')
  async reordenar(@Body() dto: ReordenarColumnasDto) {
    const columnas = await this.columnasService.reordenar(dto);
    this.chatGateway.emitirColumnasReordenadas(columnas);
    return columnas;
  }

  @Patch(':id')
  @RequirePermiso('editar', 'tablero')
  async actualizar(@Param('id') id: string, @Body() dto: ActualizarColumnaDto) {
    const columna = await this.columnasService.actualizar(id, dto);
    this.chatGateway.emitirColumnaActualizada(columna);
    return columna;
  }

  @Delete(':id')
  @RequirePermiso('eliminar', 'tablero')
  @HttpCode(204)
  async eliminar(@Param('id') id: string) {
    await this.columnasService.eliminar(id);
    this.chatGateway.emitirColumnaEliminada(id);
  }
}
