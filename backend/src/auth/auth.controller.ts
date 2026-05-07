import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('api/auth/register')
  async register(@Body() body: { username: string; password: string }) {
    if (!body.username || !body.password) throw new HttpException('Missing', HttpStatus.BAD_REQUEST);
    const user = await this.auth.register(body.username, body.password);
    return { user };
  }

  @Post('api/auth/login')
  async login(@Body() body: { username: string; password: string }) {
    const user = await this.auth.validateUser(body.username, body.password);
    if (!user) throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    return this.auth.login(user);
  }
}
