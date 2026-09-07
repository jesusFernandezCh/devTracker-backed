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
import { CanalAreaService } from './canal-area.service';
import { CrearCanalAreaDto, ActualizarCanalAreaDto } from './dto/canal-area.dto';
import { RequirePermiso } from '../common/decorators/permisos.decorator';

@Controller('canal-area')
export class CanalAreaController {
  constructor(private readonly canalAreaService: CanalAreaService) {}

  @Get()
  @RequirePermiso('leer', 'proyectos')
  findAll() {
    return this.canalAreaService.findAll();
  }

  @Post()
  @RequirePermiso('crear', 'proyectos')
  crear(@Body() dto: CrearCanalAreaDto) {
    return this.canalAreaService.crear(dto);
  }

  @Patch(':id')
  @RequirePermiso('editar', 'proyectos')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarCanalAreaDto) {
    return this.canalAreaService.actualizar(id, dto);
  }

  @Delete(':id')
  @RequirePermiso('eliminar', 'proyectos')
  @HttpCode(204)
  async eliminar(@Param('id') id: string) {
    await this.canalAreaService.eliminar(id);
  }
}
