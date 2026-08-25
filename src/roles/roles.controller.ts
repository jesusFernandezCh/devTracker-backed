import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CrearRolDto, RenombrarRolDto, TogglePermisoDto } from './dto/rol.dto';
import { RequirePermiso } from '../common/decorators/permisos.decorator';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('permisos')
  @RequirePermiso('leer', 'roles')
  matriz() {
    return this.rolesService.matriz();
  }

  @Post('permisos/restablecer')
  @RequirePermiso('editar', 'roles')
  restablecer() {
    return this.rolesService.restablecer();
  }

  @Get()
  @RequirePermiso('leer', 'roles')
  findAll() {
    return this.rolesService.findAll();
  }

  @Post()
  @RequirePermiso('crear', 'roles')
  crear(@Body() dto: CrearRolDto) {
    return this.rolesService.crear(dto);
  }

  @Patch(':id')
  @RequirePermiso('editar', 'roles')
  renombrar(@Param('id') id: string, @Body() dto: RenombrarRolDto) {
    return this.rolesService.renombrar(id, dto);
  }

  @Delete(':id')
  @RequirePermiso('eliminar', 'roles')
  eliminar(@Param('id') id: string) {
    return this.rolesService.eliminar(id);
  }

  @Patch(':id/permisos')
  @RequirePermiso('editar', 'roles')
  toggle(@Param('id') id: string, @Body() dto: TogglePermisoDto) {
    return this.rolesService.toggle(id, dto);
  }
}
