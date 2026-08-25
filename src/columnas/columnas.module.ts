import { Module } from '@nestjs/common';
import { ColumnasController } from './columnas.controller';
import { ColumnasService } from './columnas.service';

@Module({
  controllers: [ColumnasController],
  providers: [ColumnasService],
  exports: [ColumnasService],
})
export class ColumnasModule {}
