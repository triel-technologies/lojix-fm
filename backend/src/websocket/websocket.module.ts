import { Module } from '@nestjs/common';
import { RadioGateway } from './radio.gateway';

@Module({
  providers: [RadioGateway],
  exports: [RadioGateway],
})
export class WebsocketModule {}
