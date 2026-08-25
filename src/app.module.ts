import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { RolesModule } from './roles/roles.module';
import { ColumnasModule } from './columnas/columnas.module';
import { ProyectosModule } from './proyectos/proyectos.module';
import { PlaningsModule } from './planings/planings.module';
import { EquipoModule } from './equipo/equipo.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { ChatModule } from './chat/chat.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    AuthModule,
    UsuariosModule,
    RolesModule,
    ColumnasModule,
    ProyectosModule,
    PlaningsModule,
    EquipoModule,
    NotificacionesModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
