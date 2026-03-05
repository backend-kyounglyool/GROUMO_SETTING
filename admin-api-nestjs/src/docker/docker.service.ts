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
  }): Promise<DeployResult> {
    const { tenantId, subdomain, organizationName } = params;
    const baseDomain = this.configService.get<string>('BASE_DOMAIN');
    const network = this.configService.get<string>('DOCKER_NETWORK');

    try {
      this.logger.log(`Deploying tenant: ${subdomain} (${organizationName})`);

      const schemaName = `tenant_${subdomain.replace(/-/g, '_')}`;
      await this.databaseService.createSchema(schemaName);

      const backendContainer = await this.createContainer({
        name: `${subdomain}-backend`,
        image: this.configService.get<string>('GHCR_BACKEND_IMAGE')!,
        env: [
          `SUPABASE_URL=${this.configService.get('SUPABASE_URL')}`,
          `SUPABASE_ANON_KEY=${this.configService.get('SUPABASE_ANON_KEY')}`,
          `DB_SCHEMA=${schemaName}`,
          `TENANT_ID=${tenantId}`,
          `SUBDOMAIN=${subdomain}`,
          `ORGANIZATION_NAME=${organizationName}`,
        ],
        labels: {
          'traefik.enable': 'true',
          [`traefik.http.routers.${subdomain}-backend.rule`]: `Host(\`${subdomain}.${baseDomain}\`) && PathPrefix(\`/api\`)`,
          [`traefik.http.routers.${subdomain}-backend.entrypoints`]: 'websecure',
          [`traefik.http.routers.${subdomain}-backend.tls`]: 'true',
          [`traefik.http.services.${subdomain}-backend.loadbalancer.server.port`]: '8080',
          'com.centurylinklabs.watchtower.enable': 'true',
          'groumo.tenant.id': tenantId,
          'groumo.tenant.subdomain': subdomain,
        },
        network: network!,
      });

      const frontendContainer = await this.createContainer({
        name: `${subdomain}-frontend`,
        image: this.configService.get<string>('GHCR_FRONTEND_IMAGE')!,
        env: [
          `NEXT_PUBLIC_API_URL=https://${subdomain}.${baseDomain}/api`,
          `NEXT_PUBLIC_SUPABASE_URL=${this.configService.get('SUPABASE_URL')}`,
          `NEXT_PUBLIC_SUPABASE_ANON_KEY=${this.configService.get('SUPABASE_ANON_KEY')}`,
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

      await backendContainer.start();
      await frontendContainer.start();

      this.logger.log(`Tenant deployed: ${subdomain}`);

      return {
        subdomain,
        url: `https://${subdomain}.${baseDomain}`,
        backend_container: backendContainer.id,
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
}
