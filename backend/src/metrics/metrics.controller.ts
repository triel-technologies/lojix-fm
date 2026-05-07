import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import client from 'prom-client';

// Default metrics
client.collectDefaultMetrics();

@Controller('')
export class MetricsController {
  @Get('api/metrics')
  async getMetrics(@Res() res: Response) {
    try {
      const metrics = await client.register.metrics();
      res.set('Content-Type', client.register.contentType);
      res.send(metrics);
    } catch (e) {
      res.status(500).send('Error collecting metrics');
    }
  }
}
