// Supabase DB 테이블 생성 스크립트
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔗 Connected to Supabase database');
    
    // tenants 테이블 생성
    console.log('📦 Creating tenants table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        -- 단체 정보
        organization_name VARCHAR(255) NOT NULL,
        organization_name_en VARCHAR(255) NOT NULL,
        organization_type VARCHAR(50) NOT NULL,
        school VARCHAR(255),
        
        -- 서브도메인
        subdomain VARCHAR(50) UNIQUE NOT NULL,
        
        -- 회장/담당자 정보
        president_name VARCHAR(255) NOT NULL,
        contact_phone VARCHAR(50) NOT NULL,
        contact_email VARCHAR(255),
        
        -- 상태 관리
        status VARCHAR(50) DEFAULT 'pending',
        
        -- 배포 정보
        deployed_at TIMESTAMP WITH TIME ZONE,
        deployment_info JSONB,
        deployment_error TEXT,
        
        -- 거부 정보
        rejected_at TIMESTAMP WITH TIME ZONE,
        rejection_reason TEXT,
        
        -- 메타 정보
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    console.log('✅ Table created');
    
    // 인덱스 생성
    console.log('📇 Creating indexes...');
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_tenants_organization_type ON tenants(organization_type)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON tenants(created_at DESC)');
    
    console.log('✅ Indexes created');
    
    // 제약 조건 추가 (존재 여부 확인 후)
    console.log('🔒 Adding constraints...');
    
    try {
      await client.query(`
        ALTER TABLE tenants 
        ADD CONSTRAINT chk_organization_type 
        CHECK (organization_type IN (
          '중앙동아리',
          '가등록동아리',
          '소모임',
          '스터디',
          '연합동아리',
          '학생회',
          '기타'
        ))
      `);
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('⚠️  chk_organization_type constraint already exists');
      } else {
        throw err;
      }
    }
    
    try {
      await client.query(`
        ALTER TABLE tenants 
        ADD CONSTRAINT chk_status 
        CHECK (status IN ('pending', 'approved', 'rejected', 'deployed'))
      `);
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('⚠️  chk_status constraint already exists');
      } else {
        throw err;
      }
    }
    
    console.log('✅ Constraints added');
    
    console.log('\n🎉 Database setup complete!\n');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase().catch(console.error);
