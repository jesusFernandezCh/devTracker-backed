import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DocumentosService } from './documentos.service';
import { CrearDocumentoDto, ActualizarDocumentoDto } from './dto/documento.dto';
import { RequirePermiso } from '../common/decorators/permisos.decorator';
import { CurrentUser } from '../common/decorators/auth.decorators';

@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Get()
  @RequirePermiso('leer', 'proyectos')
  findAll(@Query('proyectoId') proyectoId?: string) {
    return this.documentosService.findAll(proyectoId);
  }

  @Get(':id')
  @RequirePermiso('leer', 'proyectos')
  findOne(@Param('id') id: string) {
    return this.documentosService.findOne(id);
  }

  @Post()
  @RequirePermiso('crear', 'proyectos')
  crear(@Body() dto: CrearDocumentoDto, @CurrentUser('sub') autorId: string) {
    return this.documentosService.crear(dto, autorId);
  }

  @Patch(':id')
  @RequirePermiso('editar', 'proyectos')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarDocumentoDto) {
    return this.documentosService.actualizar(id, dto);
  }

  @Delete(':id')
  @RequirePermiso('eliminar', 'proyectos')
  @HttpCode(204)
  async eliminar(@Param('id') id: string) {
    await this.documentosService.eliminar(id);
  }
}
