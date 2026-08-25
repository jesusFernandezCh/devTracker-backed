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
import { PlaningsService } from './planings.service';
import {
  ActualizarPlanningDto,
  ClonarPlanningDto,
  CrearPlanningDto,
} from './dto/planning.dto';
import { RequirePermiso } from '../common/decorators/permisos.decorator';
import { CurrentUser } from '../common/decorators/auth.decorators';
import type { JwtPayload } from '../common/decorators/auth.decorators';

@Controller('planings')
export class PlaningsController {
  constructor(private readonly planingsService: PlaningsService) {}

  @Get()
  @RequirePermiso('leer', 'planning')
  findAll() {
    return this.planingsService.findAll();
  }

  @Get(':id')
  @RequirePermiso('leer', 'planning')
  findOne(@Param('id') id: string) {
    return this.planingsService.findOne(id);
  }

  @Post()
  @RequirePermiso('crear', 'planning')
  crear(@Body() dto: CrearPlanningDto, @CurrentUser() user: JwtPayload) {
    return this.planingsService.crear(dto, user.sub);
  }

  @Post(':id/clonar')
  @RequirePermiso('crear', 'planning')
  clonar(@Param('id') id: string, @Body() dto: ClonarPlanningDto, @CurrentUser() user: JwtPayload) {
    return this.planingsService.clonar(id, dto, user.sub);
  }

  @Patch(':id')
  @RequirePermiso('editar', 'planning')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarPlanningDto) {
    return this.planingsService.actualizar(id, dto);
  }

  @Delete(':id')
  @RequirePermiso('eliminar', 'planning')
  @HttpCode(204)
  async eliminar(@Param('id') id: string) {
    await this.planingsService.eliminar(id);
  }
}
