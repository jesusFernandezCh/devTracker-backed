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
import { UsuariosService } from './usuarios.service';
import { CrearUsuarioDto, ActualizarUsuarioDto, AprobarUsuarioDto } from './dto/usuario.dto';
import { RequirePermiso } from '../common/decorators/permisos.decorator';
import { CurrentUser, Public } from '../common/decorators/auth.decorators';
import type { JwtPayload } from '../common/decorators/auth.decorators';
import { InvitacionService } from '../auth/invitacion.service';
import { InvitarUsuarioDto } from '../auth/dto';

@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly invitacionService: InvitacionService,
  ) {}

  @Get()
  @RequirePermiso('leer', 'usuarios')
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get(':id')
  @RequirePermiso('leer', 'usuarios')
  findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(id);
  }

  @Post()
  @RequirePermiso('crear', 'usuarios')
  crear(@Body() dto: CrearUsuarioDto) {
    return this.usuariosService.crear(dto);
  }

  @Post('invitar')
  @RequirePermiso('crear', 'usuarios')
  async invitar(@Body() dto: InvitarUsuarioDto, @CurrentUser() user: JwtPayload) {
    return this.invitacionService.invitar(dto.correo, dto.rolId, user.sub);
  }

  @Patch(':id')
  @RequirePermiso('editar', 'usuarios')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarUsuarioDto) {
    return this.usuariosService.actualizar(id, dto);
  }

  @Patch(':id/aprobar')
  @RequirePermiso('editar', 'usuarios')
  aprobar(@Param('id') id: string, @Body() dto: AprobarUsuarioDto) {
    return this.usuariosService.aprobar(id, dto.rolId);
  }

  @Delete(':id')
  @RequirePermiso('eliminar', 'usuarios')
  @HttpCode(204)
  async eliminar(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.usuariosService.eliminar(id, user.sub);
  }
}
