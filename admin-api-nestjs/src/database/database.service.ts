import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

/**
 * 데이터베이스 서비스
 * 
 * 역할:
 * - GROUMO_SETTING의 tenants 테이블 관리
 * - 데이터베이스 헬스체크
 * 
 * 주의: 멀티테넌트 스키마 관리는 GROUMO_TEMPLATE Backend 담당
 * 
 * @author Senior Backend Developer
 */
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

  /**
   * 데이터베이스 연결 테스트
   * 헬스체크용
   */
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

  /* ========================================
   * 아래 메서드들은 더 이상 사용하지 않음
   * Backend가 멀티테넌트 스키마 관리 담당
   * ======================================== */

  /**
   * @deprecated Backend의 TenantService가 담당
   * 
   * 스키마 생성은 GROUMO_TEMPLATE Backend에서 처리
   * DockerService는 Backend API만 호출
   */
  // async createSchema(schemaName: string): Promise<string> { ... }

  /**
   * @deprecated Backend의 TenantService가 담당
   */
  // async dropSchema(schemaName: string): Promise<boolean> { ... }

  /**
   * @deprecated Backend의 TenantService가 담당
   */
  // async initializeTenantData(...): Promise<any> { ... }
}

