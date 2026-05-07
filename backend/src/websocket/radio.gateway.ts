import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import Redis from 'ioredis';

@WebSocketGateway({ cors: { origin: '*' }, transports: ['websocket'], path: '/ws' })
export class RadioGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RadioGateway.name);
  private subscriber: Redis.Redis;

  constructor() {
    this.subscriber = new Redis(process.env.REDIS_URL || 'redis://redis:6379');
  }

  onGatewayInit() {
    this.logger.log('WebSocket gateway initialized');
    this.subscriber.subscribe('now-playing', 'listener-update', 'source-changed', 'ai-voice-generated');
    this.subscriber.on('message', (channel, message) => {
      const eventMap: Record<string, string> = {
        'now-playing': 'song_changed',
        'listener-update': 'listener_update',
        'source-changed': 'source_changed',
        'ai-voice-generated': 'ai_voice_generated',
      };
      const event = eventMap[channel];
      if (event) {
        try { this.server.emit(event, JSON.parse(message)); } catch { this.server.emit(event, message); }
      }
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
