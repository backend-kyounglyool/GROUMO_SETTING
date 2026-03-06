import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.get<string>('DATABASE_URL'),
      ssl: { rejectUnauthorized: false },
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async createSchema(schemaName: string): Promise<string> {
    const client = await this.pool.connect();

    try {
      this.logger.log(`Creating database schema: ${schemaName}`);

      await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

      await client.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".groups (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_by UUID REFERENCES "${schemaName}".users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      this.logger.log(`Schema created: ${schemaName}`);
      return schemaName;
    } catch (error) {
      this.logger.error(`Schema creation failed:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async dropSchema(schemaName: string): Promise<boolean> {
    const client = await this.pool.connect();

    try {
      this.logger.log(`Dropping database schema: ${schemaName}`);
      await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      this.logger.log(`Schema dropped: ${schemaName}`);
      return true;
    } catch (error) {
      this.logger.error(`Schema drop failed:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async initializeTenantData(
    schemaName: string,
    organizationData: {
      tenantId: string;
      organizationName: string;
      organizationNameEn: string;
      organizationType: string;
      school?: string;
      subdomain: string;
    },
  ): Promise<any> {
    const client = await this.pool.connect();

    try {
      this.logger.log(`Initializing tenant data for: ${schemaName}`);

      // group 테이블에 단체 정보 insert
      const description = `${organizationData.organizationType}${
        organizationData.school ? ` - ${organizationData.school}` : ''
      }\n영문명: ${organizationData.organizationNameEn}\n서브도메인: ${
        organizationData.subdomain
      }`;

      const result = await client.query(
        `
        INSERT INTO "${schemaName}".groups (id, name, description, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *
      `,
        [organizationData.tenantId, organizationData.organizationName, description],
      );

      this.logger.log(`Tenant data initialized for: ${schemaName}`);
      return result.rows[0];
    } catch (error) {
      this.logger.error(`Tenant data initialization failed:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async testConnection(): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT NOW()');
      this.logger.log(`Database connected: ${result.rows[0].now}`);
      return true;
    } catch (error) {
      this.logger.error('Database connection failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}
