import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { StreamService } from './stream.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('/')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Get('now-playing')
  getNowPlaying() {
    return this.streamService.getNowPlaying();
  }

  @Get('history')
  getHistory() {
    return this.streamService.getHistory(20);
  }

  @Get('listeners')
  getListeners() {
    return { listeners: this.streamService.getNowPlaying().listeners };
  }

  @Get('status')
  getStatus() {
    return {
      ...this.streamService.getNowPlaying(),
      uptime: process.uptime(),
      endpoints: {
        hq: `https://${process.env.DOMAIN}/hq`,
        standard: `https://${process.env.DOMAIN}/live`,
        mobile: `https://${process.env.DOMAIN}/mobile`,
      },
    };
  }

  @Post('skip')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin','dj')
  async skipTrack() {
    await this.streamService.skipTrack();
    return { success: true };
  }

  @Post('source')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async setSource(@Body() body: { source: 'autodj' | 'spotify' | 'manual' | 'live' }) {
    await this.streamService.setSource(body.source);
    return { success: true };
  }
}
