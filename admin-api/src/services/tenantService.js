import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * 분양 신청 생성
 */
export const createTenant = async (data) => {
  const { data: tenant, error } = await supabase
    .from('tenants')
    .insert([data])
    .select()
    .single();
  
  if (error) throw new Error(`DB Error: ${error.message}`);
  return tenant;
};

/**
 * 분양 신청 목록 조회
 */
export const getTenants = async ({ status, page = 1, limit = 20 }) => {
  let query = supabase
    .from('tenants')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);
  
  const { data: tenants, error, count } = await query;
  
  if (error) throw new Error(`DB Error: ${error.message}`);
  
  return {
    tenants,
    page: parseInt(page),
    limit: parseInt(limit),
    total: count,
    totalPages: Math.ceil(count / limit)
  };
};

/**
 * 분양 신청 상세 조회
 */
export const getTenantById = async (id) => {
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`DB Error: ${error.message}`);
  }
  
  return tenant;
};

/**
 * 서브도메인 중복 체크
 */
export const checkSubdomainExists = async (subdomain) => {
  const { data, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('subdomain', subdomain)
    .limit(1);
  
  if (error) throw new Error(`DB Error: ${error.message}`);
  
  return data && data.length > 0;
};

/**
 * 테넌트 상태 업데이트
 */
export const updateTenantStatus = async (id, status, additionalData = {}) => {
  const { data: tenant, error } = await supabase
    .from('tenants')
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...additionalData
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw new Error(`DB Error: ${error.message}`);
  return tenant;
};

/**
 * 테넌트 삭제
 */
export const deleteTenant = async (id) => {
  const { error } = await supabase
    .from('tenants')
    .delete()
    .eq('id', id);
  
  if (error) throw new Error(`DB Error: ${error.message}`);
  return true;
};
