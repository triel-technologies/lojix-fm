import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class QueueService {
  private redis: Redis.Redis;
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');
  }

  async pushAnnouncer(filePath: string) {
    await this.redis.lpush('announcer-queue', JSON.stringify({ file: filePath, ts: Date.now() }));
  }
}
