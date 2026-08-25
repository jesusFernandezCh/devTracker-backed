import { Module } from '@nestjs/common';
import { PlaningsController } from './planings.controller';
import { PlaningsService } from './planings.service';

@Module({
  controllers: [PlaningsController],
  providers: [PlaningsService],
  exports: [PlaningsService],
})
export class PlaningsModule {}
