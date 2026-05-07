import { Module } from '@nestjs/common';
import { AnnouncerService } from './announcer.service';

@Module({
  providers: [AnnouncerService],
  exports: [AnnouncerService],
})
export class AnnouncerModule {}
