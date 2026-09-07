import { Module } from '@nestjs/common';
import { CanalAreaController } from './canal-area.controller';
import { CanalAreaService } from './canal-area.service';

@Module({
  controllers: [CanalAreaController],
  providers: [CanalAreaService],
  exports: [CanalAreaService],
})
export class CanalAreaModule {}
