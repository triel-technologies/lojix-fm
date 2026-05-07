import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as net from 'net';
import * as fs from 'fs';

interface NowPlayingDto {
  station: string;
  live: boolean;
  source: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  listeners: number;
  startedAt: string;
  duration: number;
  position: number;
}

@Injectable()
export class StreamService {
  private readonly logger = new Logger(StreamService.name);
  private nowPlaying: NowPlayingDto = {
    station: 'LoJix FM',
    live: false,
    source: 'autodj',
    title: 'Loading...',
    artist: '',
    album: '',
    albumArt: '',
    listeners: 0,
    startedAt: new Date().toISOString(),
    duration: 0,
    position: 0,
  };

  private redis: Redis.Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');
  }

  @Cron('*/5 * * * * *')
  async pollMetadata() {
    try {
      const raw = fs.readFileSync('/tmp/lojix_nowplaying', 'utf8').trim();
      const [artist, title, album] = raw.split('|||');
      if (title !== this.nowPlaying.title || artist !== this.nowPlaying.artist) {
        this.nowPlaying = {
          ...this.nowPlaying,
          title: title || 'Unknown',
          artist: artist || 'Unknown',
          album: album || '',
          startedAt: new Date().toISOString(),
        };
        this.nowPlaying.albumArt = await this.fetchAlbumArt(artist, title);
        await this.redis.publish('now-playing', JSON.stringify(this.nowPlaying));
        this.logger.log(`Now playing: ${artist} - ${title}`);
      }
    } catch (e) {
      // ignore read errors
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async pollListeners() {
    try {
      const res = await fetch(
        `http://${process.env.ICECAST_HOST || '127.0.0.1'}:${process.env.ICECAST_PORT || 8000}/status-json.xsl`,
      );
      const data = await res.json();
      const sources = data?.icestats?.source;
      const total = Array.isArray(sources)
        ? sources.reduce((acc: number, s: any) => acc + (s.listeners || 0), 0)
        : (sources?.listeners || 0);
      if (total !== this.nowPlaying.listeners) {
        this.nowPlaying.listeners = total;
        await this.redis.publish('listener-update', JSON.stringify({ count: total }));
      }
    } catch (e) {}
  }

  getNowPlaying() {
    return this.nowPlaying;
  }

  async getHistory(limit = 20) {
    try {
      const history = await this.redis.lrange('play-history', 0, limit - 1);
      return history.map((h) => JSON.parse(h));
    } catch (e) {
      return [];
    }
  }

  async liquidsoapCommand(cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      client.connect(1234, process.env.LIQUIDSOAP_HOST || 'liquidsoap', () => {
        client.write(cmd + '\n');
      });
      let response = '';
      client.on('data', (data) => {
        response += data.toString();
        if (response.includes('END')) {
          client.destroy();
          resolve(response.replace('END', '').trim());
        }
      });
      client.on('error', (err) => reject(err));
      setTimeout(() => { client.destroy(); reject(new Error('Timeout')); }, 5000);
    });
  }

  async skipTrack() {
    await this.liquidsoapCommand('var.set liq_skip=true');
  }

  async setSource(source: 'autodj' | 'spotify' | 'manual' | 'live') {
    this.nowPlaying.source = source;
    await this.redis.publish('source-changed', JSON.stringify({ source }));
  }

  private async fetchAlbumArt(artist: string, title: string) {
    try {
      const query = encodeURIComponent(`${artist} ${title}`);
      const res = await fetch(
        `https://musicbrainz.org/ws/2/recording/?query=${query}&limit=1&fmt=json`,
        { headers: { 'User-Agent': 'LoJixFM/1.0 (admin@lojix.my.id)' } },
      );
      const data = await res.json();
      const mbid = data?.recordings?.[0]?.releases?.[0]?.id;
      if (mbid) return `https://coverartarchive.org/release/${mbid}/front-250`;
    } catch (e) {}
    return '/images/default-album.png';
  }
}
