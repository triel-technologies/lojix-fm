import { Injectable, Logger } from '@nestjs/common';
import * as mysql from 'mysql2/promise';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private pool: mysql.Pool;

  constructor(private readonly jwtService: JwtService) {
    const host = process.env.DB_HOST || 'mysql';
    const user = process.env.DB_USER || 'lojix';
    const password = process.env.DB_PASSWORD || 'changeme';
    const database = process.env.DB_NAME || 'lojixfm';
    this.pool = mysql.createPool({ host, user, password, database, waitForConnections: true, connectionLimit: 10 });
  }

  async register(username: string, password: string, role = 'admin') {
    const hash = await bcrypt.hash(password, 10);
    const [result]: any = await this.pool.execute(
      'INSERT INTO users(username, password_hash, role) VALUES(?, ?, ?)',
      [username, hash, role],
    );
    const insertId = result.insertId || null;
    return { id: insertId, username, role };
  }

  async validateUser(username: string, password: string) {
    const [rows]: any = await this.pool.execute('SELECT id,username,password_hash,role FROM users WHERE username=? LIMIT 1', [username]);
    const user = rows && rows[0];
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return null;
    return { id: user.id, username: user.username, role: user.role };
  }

  async login(user: { id: number; username: string; role: string }) {
    const payload = { sub: user.id, username: user.username, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }
}
