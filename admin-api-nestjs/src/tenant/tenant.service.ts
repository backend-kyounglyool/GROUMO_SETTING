import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TenantService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createTenant(data: Record<string, unknown>) {
    const id = crypto.randomUUID();
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map((f) => {
      const v = data[f];
      if (v && typeof v === 'object') return JSON.stringify(v);
      return v ?? null;
    });

    const sql = `INSERT INTO tenants (id, ${fields.join(', ')}) VALUES (?, ${placeholders})`;
    await this.databaseService.query(sql, [id, ...values]);

    return this.getTenantById(id);
  }

  async getTenants(params: { status?: string; page: number; limit: number }) {
    const { status, page, limit } = params;
    const offset = (page - 1) * limit;

    let where = '';
    const queryParams: unknown[] = [];

    if (status) {
      where = 'WHERE status = ?';
      queryParams.push(status);
    }

    const countSql = `SELECT COUNT(*) as total FROM tenants ${where}`;
    const [countRow] = await this.databaseService.query(countSql, queryParams);
    const total = (countRow as any).total;

    const dataSql = `SELECT * FROM tenants ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const tenants = await this.databaseService.query(dataSql, [
      ...queryParams,
      limit,
      offset,
    ]);

    return {
      tenants: this.parseJsonFields(tenants as any[]),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTenantById(id: string) {
    const sql = 'SELECT * FROM tenants WHERE id = ?';
    const rows = await this.databaseService.query(sql, [id]);
    const tenant = (rows as any[])[0] || null;
    return tenant ? this.parseJsonField(tenant) : null;
  }

  async checkSubdomainExists(subdomain: string): Promise<boolean> {
    const sql = 'SELECT id FROM tenants WHERE subdomain = ? LIMIT 1';
    const rows = await this.databaseService.query(sql, [subdomain]);
    return (rows as any[]).length > 0;
  }

  async updateTenantStatus(
    id: string,
    status: string,
    additionalData: Record<string, unknown> = {},
  ) {
    const updates: string[] = ['status = ?', 'updated_at = NOW()'];
    const values: unknown[] = [status];

    for (const [key, value] of Object.entries(additionalData)) {
      updates.push(`${key} = ?`);
      if (value instanceof Date) {
        values.push(value);
      } else if (value && typeof value === 'object') {
        values.push(JSON.stringify(value));
      } else {
        values.push(value ?? null);
      }
    }

    values.push(id);
    const sql = `UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`;
    await this.databaseService.query(sql, values);

    return this.getTenantById(id);
  }

  async deleteTenant(id: string): Promise<boolean> {
    const sql = 'DELETE FROM tenants WHERE id = ?';
    await this.databaseService.query(sql, [id]);
    return true;
  }

  private parseJsonFields(rows: any[]): any[] {
    return rows.map((row) => this.parseJsonField(row));
  }

  private parseJsonField(row: any): any {
    if (row.deployment_info && typeof row.deployment_info === 'string') {
      try {
        row.deployment_info = JSON.parse(row.deployment_info);
      } catch {
        // keep as string
      }
    }
    return row;
  }
}
