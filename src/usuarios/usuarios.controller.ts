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
import { CrearUsuarioDto, ActualizarUsuarioDto } from './dto/usuario.dto';
import { RequirePermiso } from '../common/decorators/permisos.decorator';
import { CurrentUser } from '../common/decorators/auth.decorators';
import type { JwtPayload } from '../common/decorators/auth.decorators';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

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

  @Patch(':id')
  @RequirePermiso('editar', 'usuarios')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarUsuarioDto) {
    return this.usuariosService.actualizar(id, dto);
  }

  @Delete(':id')
  @RequirePermiso('eliminar', 'usuarios')
  @HttpCode(204)
  async eliminar(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.usuariosService.eliminar(id, user.sub);
  }
}
