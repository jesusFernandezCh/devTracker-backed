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
import { ChatGateway } from '../chat/chat.gateway';
import type { JwtPayload } from '../common/decorators/auth.decorators';

@Controller('planings')
export class PlaningsController {
  constructor(
    private readonly planingsService: PlaningsService,
    private readonly chatGateway: ChatGateway,
  ) {}

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
  async crear(@Body() dto: CrearPlanningDto, @CurrentUser() user: JwtPayload) {
    const planning = await this.planingsService.crear(dto, user.sub);
    this.chatGateway.emitirPlanningCreado(planning, planning.proyectoId);
    return planning;
  }

  @Post(':id/clonar')
  @RequirePermiso('crear', 'planning')
  async clonar(@Param('id') id: string, @Body() dto: ClonarPlanningDto, @CurrentUser() user: JwtPayload) {
    const planning = await this.planingsService.clonar(id, dto, user.sub);
    this.chatGateway.emitirPlanningCreado(planning, planning.proyectoId);
    return planning;
  }

  @Patch(':id')
  @RequirePermiso('editar', 'planning')
  async actualizar(@Param('id') id: string, @Body() dto: ActualizarPlanningDto) {
    const planning = await this.planingsService.actualizar(id, dto);
    this.chatGateway.emitirPlanningActualizado(planning, planning.proyectoId);
    return planning;
  }

  @Delete(':id')
  @RequirePermiso('eliminar', 'planning')
  @HttpCode(204)
  async eliminar(@Param('id') id: string) {
    const planning = await this.planingsService.findOne(id);
    await this.planingsService.eliminar(id);
    this.chatGateway.emitirPlanningEliminado(id, planning.proyectoId);
  }
}
