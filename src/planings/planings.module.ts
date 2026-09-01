import { Module } from '@nestjs/common';
import { PlaningsController } from './planings.controller';
import { PlaningsService } from './planings.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [PlaningsController],
  providers: [PlaningsService],
  exports: [PlaningsService],
})
export class PlaningsModule {}
