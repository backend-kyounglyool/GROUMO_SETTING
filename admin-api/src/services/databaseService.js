import pg from 'pg';

const { Pool } = pg;

/**
 * 데이터베이스 연결 풀
 */
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * 테넌트 스키마 생성
 */
export const createDatabaseSchema = async (schemaName) => {
  const client = await pool.connect();
  
  try {
    console.log(`📦 Creating database schema: ${schemaName}`);
    
    // 스키마 생성
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    
    // 기본 테이블 생성 (예시)
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_by UUID REFERENCES ${schemaName}.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // TODO: 실제 애플리케이션 스키마에 맞게 테이블 추가
    
    console.log(`✅ Schema created: ${schemaName}`);
    
    return schemaName;
  } catch (error) {
    console.error(`❌ Schema creation failed:`, error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 테넌트 스키마 삭제
 */
export const dropDatabaseSchema = async (schemaName) => {
  const client = await pool.connect();
  
  try {
    console.log(`🗑️  Dropping database schema: ${schemaName}`);
    
    await client.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
    
    console.log(`✅ Schema dropped: ${schemaName}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Schema drop failed:`, error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 연결 테스트
 */
export const testConnection = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  } finally {
    client.release();
  }
};
