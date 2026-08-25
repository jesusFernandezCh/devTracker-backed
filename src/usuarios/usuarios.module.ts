import { Module } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { PasswordService } from '../auth/password.service';

@Module({
  controllers: [UsuariosController],
  providers: [UsuariosService, PasswordService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
