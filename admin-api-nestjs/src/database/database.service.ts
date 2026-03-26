import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool!: mysql.Pool;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.pool = mysql.createPool({
      host: this.configService.get<string>('MYSQL_HOST', 'localhost'),
      port: this.configService.get<number>('MYSQL_PORT', 3306),
      user: this.configService.get<string>('MYSQL_USER', 'groumo'),
      password: this.configService.get<string>('MYSQL_PASSWORD', 'groumo'),
      database: this.configService.get<string>('MYSQL_DATABASE', 'groumo'),
      waitForConnections: true,
      connectionLimit: 10,
      timezone: '+09:00',
    });

    await this.testConnection();
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    const [rows] = await this.pool.query(sql, params);
    return rows as any[];
  }

  async testConnection(): Promise<boolean> {
    try {
      const [rows] = await this.pool.execute('SELECT NOW() as now');
      const now = (rows as any[])[0]?.now;
      this.logger.log(`MySQL connected: ${now}`);
      return true;
    } catch (error) {
      this.logger.error('MySQL connection failed:', error);
      throw error;
    }
  }
}
