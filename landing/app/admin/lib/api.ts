const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

function getApiKey(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('admin_api_key') || '';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': getApiKey(),
      ...options.headers,
    },
  });

  if (res.status === 401 || res.status === 403) {
    sessionStorage.removeItem('admin_api_key');
    window.location.href = '/admin';
    throw new Error('인증이 만료되었습니다');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || '요청 실패');
  }
  return data;
}

export interface Tenant {
  id: string;
  organization_name: string;
  organization_name_en: string;
  organization_type: string;
  school?: string;
  subdomain: string;
  president_name: string;
  contact_phone: string;
  contact_email?: string;
  status: 'pending' | 'approved' | 'rejected' | 'deployed';
  deployed_at?: string;
  deployment_info?: Record<string, unknown>;
  deployment_error?: string;
  rejected_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

interface ListResponse {
  success: boolean;
  data: Tenant[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface SingleResponse {
  success: boolean;
  data: Tenant;
  message?: string;
}

export async function fetchTenants(params?: { status?: string; page?: number; limit?: number }): Promise<ListResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  return request<ListResponse>(`/api/tenants${qs ? `?${qs}` : ''}`);
}

export async function approveTenant(id: string): Promise<SingleResponse> {
  return request<SingleResponse>(`/api/tenants/${id}/approve`, { method: 'PUT' });
}

export async function rejectTenant(id: string, reason: string): Promise<SingleResponse> {
  return request<SingleResponse>(`/api/tenants/${id}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  });
}

export async function deleteTenant(id: string): Promise<{ success: boolean; message: string }> {
  return request(`/api/tenants/${id}`, { method: 'DELETE' });
}

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  created: number;
  tenantId?: string;
  subdomain?: string;
}

export async function getDockerStatus(): Promise<{ containers: DockerContainer[]; total: number }> {
  const res = await request<{ success: boolean; data: { containers: DockerContainer[]; total: number } }>('/api/tenants/docker/status');
  return res.data || { containers: [], total: 0 };
}
