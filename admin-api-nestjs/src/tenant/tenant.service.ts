import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class TenantService {
  private readonly supabase: SupabaseClient;
  private readonly logger = new Logger(TenantService.name);

  constructor(private readonly configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async createTenant(data: Record<string, unknown>) {
    const { data: tenant, error } = await this.supabase
      .from('tenants')
      .insert([data])
      .select()
      .single();

    if (error) throw new Error(`DB Error: ${error.message}`);
    return tenant;
  }

  async getTenants(params: { status?: string; page: number; limit: number }) {
    const { status, page, limit } = params;

    let query = this.supabase
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
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    };
  }

  async getTenantById(id: string) {
    const { data: tenant, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`DB Error: ${error.message}`);
    }

    return tenant;
  }

  async checkSubdomainExists(subdomain: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', subdomain)
      .limit(1);

    if (error) throw new Error(`DB Error: ${error.message}`);

    return data !== null && data.length > 0;
  }

  async updateTenantStatus(
    id: string,
    status: string,
    additionalData: Record<string, unknown> = {},
  ) {
    const { data: tenant, error } = await this.supabase
      .from('tenants')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...additionalData,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`DB Error: ${error.message}`);
    return tenant;
  }

  async deleteTenant(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('tenants')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`DB Error: ${error.message}`);
    return true;
  }
}
