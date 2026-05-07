import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { StreamModule } from './stream/stream.module';
import { AnnouncerModule } from './announcer/announcer.module';
import { WebsocketModule } from './websocket/websocket.module';
import { MetricsModule } from './metrics/metrics.module';
import { AuthModule } from './auth/auth.module';
import { QueueModule } from './queue/queue.module';
import { AudioModule } from './audio/audio.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt.guard';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    JwtModule.register({ secret: process.env.JWT_SECRET || 'devsecret' }),
    StreamModule,
    AnnouncerModule,
    MetricsModule,
    WebsocketModule,
    AuthModule,
    QueueModule,
    AudioModule,
  ],
  providers: [AuthService, JwtAuthGuard],
  controllers: [AuthController],
})
export class AppModule {}
