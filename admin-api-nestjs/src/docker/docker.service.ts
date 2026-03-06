import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Docker from 'dockerode';
import { DatabaseService } from '../database/database.service';

export interface DeployResult {
  subdomain: string;
  url: string;
  backend_container: string;
  frontend_container: string;
  schema: string;
  deployed_at: string;
}

export interface RemoveResult {
  subdomain: string;
  removed_containers: number;
  removed_at: string;
}

interface ContainerOptions {
  name: string;
  image: string;
  env: string[];
  labels: Record<string, string>;
  network: string;
}

@Injectable()
export class DockerService {
  private readonly docker: Docker;
  private readonly logger = new Logger(DockerService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {
    this.docker = new Docker({
      socketPath:
        this.configService.get<string>('DOCKER_SOCKET') ||
        '/var/run/docker.sock',
    });
  }

  async deployTenant(params: {
    tenantId: string;
    subdomain: string;
    organizationName: string;
    organizationNameEn: string;
    organizationType: string;
    school?: string;
  }): Promise<DeployResult> {
    const { tenantId, subdomain, organizationName, organizationNameEn, organizationType, school } = params;
    const baseDomain = this.configService.get<string>('BASE_DOMAIN');
    const network = this.configService.get<string>('DOCKER_NETWORK');

    try {
      this.logger.log(`Deploying tenant: ${subdomain} (${organizationName})`);

      // 1. 스키마 생성
      const schemaName = `tenant_${subdomain.replace(/-/g, '_')}`;
      await this.databaseService.createSchema(schemaName);
      
      // 2. Backend API를 호출하여 group 테이블에 조직 정보 추가
      await this.callBackendInitializeApi({
        tenantId,
        organizationName,
        organizationNameEn,
        organizationType,
        school,
        subdomain,
      });

      // Frontend만 배포 (Backend는 groumo.com 공유)
      const frontendContainer = await this.createContainer({
        name: `${subdomain}-frontend`,
        image: this.configService.get<string>('GHCR_FRONTEND_IMAGE')!,
        env: [
          `NEXT_PUBLIC_API_URL=https://groumo.com/api`,  // 공유 Backend 사용
          `NEXT_PUBLIC_SUPABASE_URL=${this.configService.get('SUPABASE_URL')}`,
          `NEXT_PUBLIC_SUPABASE_ANON_KEY=${this.configService.get('SUPABASE_ANON_KEY')}`,
          `NEXT_PUBLIC_TENANT_ID=${tenantId}`,  // 클라이언트 사이드 접근용
          `TENANT_ID=${tenantId}`,
          `SUBDOMAIN=${subdomain}`,
        ],
        labels: {
          'traefik.enable': 'true',
          [`traefik.http.routers.${subdomain}-frontend.rule`]: `Host(\`${subdomain}.${baseDomain}\`)`,
          [`traefik.http.routers.${subdomain}-frontend.entrypoints`]: 'websecure',
          [`traefik.http.routers.${subdomain}-frontend.tls`]: 'true',
          [`traefik.http.services.${subdomain}-frontend.loadbalancer.server.port`]: '3000',
          'com.centurylinklabs.watchtower.enable': 'true',
          'groumo.tenant.id': tenantId,
          'groumo.tenant.subdomain': subdomain,
        },
        network: network!,
      });

      await frontendContainer.start();

      this.logger.log(`Tenant deployed: ${subdomain} (Frontend only, shared Backend)`);

      return {
        subdomain,
        url: `https://${subdomain}.${baseDomain}`,
        backend_container: 'shared',  // Backend 공유
        frontend_container: frontendContainer.id,
        schema: schemaName,
        deployed_at: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Deployment failed for ${subdomain}:`, error);
      throw error;
    }
  }

  async removeTenant(subdomain: string): Promise<RemoveResult> {
    try {
      this.logger.log(`Removing tenant: ${subdomain}`);

      const containers = await this.docker.listContainers({ all: true });
      const tenantContainers = containers.filter(
        (c) => c.Labels['groumo.tenant.subdomain'] === subdomain,
      );

      for (const containerInfo of tenantContainers) {
        const container = this.docker.getContainer(containerInfo.Id);

        try {
          await container.stop();
        } catch {
          // already stopped
        }

        await container.remove();
        this.logger.log(`Removed container: ${containerInfo.Names[0]}`);
      }

      this.logger.log(`Tenant removed: ${subdomain}`);

      return {
        subdomain,
        removed_containers: tenantContainers.length,
        removed_at: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Removal failed for ${subdomain}:`, error);
      throw error;
    }
  }

  async getTenantStatus(subdomain: string) {
    const containers = await this.docker.listContainers({ all: true });
    const tenantContainers = containers.filter(
      (c) => c.Labels['groumo.tenant.subdomain'] === subdomain,
    );

    return tenantContainers.map((c) => ({
      id: c.Id,
      name: c.Names[0],
      image: c.Image,
      state: c.State,
      status: c.Status,
      created: c.Created,
    }));
  }

  private async createContainer(options: ContainerOptions) {
    const { name, image, env, labels, network } = options;

    try {
      const existingContainer = this.docker.getContainer(name);
      await existingContainer.stop();
      await existingContainer.remove();
    } catch {
      // doesn't exist
    }

    return this.docker.createContainer({
      name,
      Image: image,
      Env: env,
      Labels: labels,
      HostConfig: {
        NetworkMode: network,
        RestartPolicy: { Name: 'unless-stopped' },
      },
    });
  }

  /**
   * Backend API를 호출하여 group 테이블 초기화
   */
  private async callBackendInitializeApi(params: {
    tenantId: string;
    organizationName: string;
    organizationNameEn: string;
    organizationType: string;
    school?: string;
    subdomain: string;
  }) {
    const backendUrl = `https://${this.configService.get('BASE_DOMAIN')}/api/admin/groups/initialize-tenant`;
    const adminApiKey = this.configService.get('ADMIN_API_KEY');

    try {
      this.logger.log(`Calling backend initialize API: ${backendUrl}`);

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-API-Key': adminApiKey || '',
        },
        body: JSON.stringify({
          tenantId: params.tenantId,
          organizationName: params.organizationName,
          organizationNameEn: params.organizationNameEn,
          organizationType: params.organizationType,
          school: params.school,
          subdomain: params.subdomain,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      this.logger.log(`Backend initialize result: ${JSON.stringify(result)}`);

      return result;
    } catch (error) {
      this.logger.error(`Failed to call backend initialize API`, error);
      throw error;
    }
  }
}

  async getDockerStatus() {
    try {
      const containers = await this.docker.listContainers({ all: true });
      
      const status = containers.map((c) => ({
        id: c.Id.substring(0, 12),
        name: c.Names[0]?.replace(/^\//, '') || '',
        image: c.Image,
        state: c.State,
        status: c.Status,
        created: c.Created,
        tenantId: c.Labels['groumo.tenant.id'],
        subdomain: c.Labels['groumo.tenant.subdomain'],
      }));

      return { containers: status, total: status.length };
    } catch (error) {
      this.logger.error('Failed to get docker status', error);
      throw error;
    }
  }
