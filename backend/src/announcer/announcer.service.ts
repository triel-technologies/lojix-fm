import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import Redis from 'ioredis';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class AnnouncerService {
  private readonly logger = new Logger(AnnouncerService.name);
  private readonly ttsDir = '/tts';
  private redis: Redis.Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');
  }

  async generateAnnouncement(text: string): Promise<string> {
    const filename = `ann_${Date.now()}`;
    const outputPath = path.join(this.ttsDir, `${filename}.mp3`);

    try {
      await execAsync(
        `echo "${text.replace(/"/g, '\\\"')}" | piper --model /models/en_US-lessac-high.onnx --output_file /tmp/${filename}.wav --length_scale 0.85 && ffmpeg -y -i /tmp/${filename}.wav -af "loudnorm=I=-14:TP=-1.5,afade=t=in:d=0.2,afade=t=out:st=2.0:d=0.3" -codec:a libmp3lame -b:a 192k ${outputPath} && rm /tmp/${filename}.wav`,
        { timeout: 30000 },
      );

      this.logger.log(`Generated announcement: ${filename}.mp3`);
      await this.queueIntoLiquidsoap(outputPath);
      await this.redis.publish('ai-voice-generated', JSON.stringify({ text, file: outputPath }));
      return outputPath;
    } catch (err) {
      this.logger.error(`TTS generation failed: ${err.message}`);
      throw err;
    }
  }

  private async queueIntoLiquidsoap(filePath: string) {
    return new Promise<void>((resolve, reject) => {
      const net = require('net');
      const client = new net.Socket();
      client.connect(1234, process.env.LIQUIDSOAP_HOST || 'liquidsoap', () => {
        client.write(`request.push announcer_queue ${filePath}\n`);
        setTimeout(() => { client.destroy(); resolve(); }, 1000);
      });
      client.on('error', reject);
    });
  }

  @Cron('0 */15 * * * *')
  async scheduledAnnouncement() {
    this.logger.log('Scheduled announcer trigger');
    await this.generateWithAI();
  }

  async generateWithAI(context?: string) {
    const hour = new Date().getHours();
    let timeOfDay = 'night';
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';

    let script = 'You are listening to LoJix FM.';
    if (process.env.OPENAI_API_KEY) {
      // Minimal LLM call (optional)
      try {
        const prompt = `You are the AI voice of LoJix FM. Generate a single short radio announcement (1-2 sentences). Time of day: ${timeOfDay}. Output only the announcement.`;
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 60, temperature: 0.9 }),
        });
        const data = await res.json();
        script = data.choices?.[0]?.message?.content?.trim() || script;
      } catch (e) {
        this.logger.warn('LLM script generation failed, using fallback.');
      }
    }

    return this.generateAnnouncement(script + (context ? ` Context: ${context}` : ''));
  }
}
