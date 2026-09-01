import { Module } from '@nestjs/common';
import { EquipoController } from './equipo.controller';
import { EquipoService } from './equipo.service';
import { ChatModule } from '../chat/chat.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [ChatModule, NotificacionesModule],
  controllers: [EquipoController],
  providers: [EquipoService],
  exports: [EquipoService],
})
export class EquipoModule {}
