import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.setGlobalPrefix('api');
  app.enableCors({ origin: process.env.FRONTEND_URL || '*' });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useWebSocketAdapter(new IoAdapter(app));

  app.use(
    '/api/',
    // @ts-ignore
    rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true }),
  );

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001);
  console.log('LoJix FM Backend running on :3001');
}

bootstrap();
