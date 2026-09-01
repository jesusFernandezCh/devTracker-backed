import { Module } from '@nestjs/common';
import { ColumnasController } from './columnas.controller';
import { ColumnasService } from './columnas.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [ColumnasController],
  providers: [ColumnasService],
  exports: [ColumnasService],
})
export class ColumnasModule {}
