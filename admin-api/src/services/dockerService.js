import Docker from 'dockerode';
import { createDatabaseSchema } from './databaseService.js';

const docker = new Docker({
  socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock'
});

/**
 * 테넌트 배포 (컨테이너 생성)
 */
export const deployTenant = async ({ tenantId, subdomain, organizationName }) => {
  try {
    console.log(`🚀 Deploying tenant: ${subdomain} (${organizationName})`);
    
    // 1. 데이터베이스 스키마 생성
    const schemaName = `tenant_${subdomain.replace(/-/g, '_')}`;
    await createDatabaseSchema(schemaName);
    
    // 2. Backend 컨테이너 생성
    const backendContainer = await createContainer({
      name: `${subdomain}-backend`,
      image: process.env.GHCR_BACKEND_IMAGE,
      env: [
        `SUPABASE_URL=${process.env.SUPABASE_URL}`,
        `SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY}`,
        `DB_SCHEMA=${schemaName}`,
        `TENANT_ID=${tenantId}`,
        `SUBDOMAIN=${subdomain}`,
        `ORGANIZATION_NAME=${organizationName}`
      ],
      labels: {
        'traefik.enable': 'true',
        [`traefik.http.routers.${subdomain}-backend.rule`]: `Host(\`${subdomain}.${process.env.BASE_DOMAIN}\`) && PathPrefix(\`/api\`)`,
        [`traefik.http.routers.${subdomain}-backend.entrypoints`]: 'websecure',
        [`traefik.http.routers.${subdomain}-backend.tls`]: 'true',
        [`traefik.http.services.${subdomain}-backend.loadbalancer.server.port`]: '8080',
        'com.centurylinklabs.watchtower.enable': 'true',
        'groumo.tenant.id': tenantId,
        'groumo.tenant.subdomain': subdomain
      },
      network: process.env.DOCKER_NETWORK
    });
    
    // 3. Frontend 컨테이너 생성
    const frontendContainer = await createContainer({
      name: `${subdomain}-frontend`,
      image: process.env.GHCR_FRONTEND_IMAGE,
      env: [
        `NEXT_PUBLIC_API_URL=https://${subdomain}.${process.env.BASE_DOMAIN}/api`,
        `NEXT_PUBLIC_SUPABASE_URL=${process.env.SUPABASE_URL}`,
        `NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY}`,
        `TENANT_ID=${tenantId}`,
        `SUBDOMAIN=${subdomain}`
      ],
      labels: {
        'traefik.enable': 'true',
        [`traefik.http.routers.${subdomain}-frontend.rule`]: `Host(\`${subdomain}.${process.env.BASE_DOMAIN}\`)`,
        [`traefik.http.routers.${subdomain}-frontend.entrypoints`]: 'websecure',
        [`traefik.http.routers.${subdomain}-frontend.tls`]: 'true',
        [`traefik.http.services.${subdomain}-frontend.loadbalancer.server.port`]: '3000',
        'com.centurylinklabs.watchtower.enable': 'true',
        'groumo.tenant.id': tenantId,
        'groumo.tenant.subdomain': subdomain
      },
      network: process.env.DOCKER_NETWORK
    });
    
    // 4. 컨테이너 시작
    await backendContainer.start();
    await frontendContainer.start();
    
    console.log(`✅ Tenant deployed: ${subdomain}`);
    
    return {
      subdomain,
      url: `https://${subdomain}.${process.env.BASE_DOMAIN}`,
      backend_container: backendContainer.id,
      frontend_container: frontendContainer.id,
      schema: schemaName,
      deployed_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`❌ Deployment failed for ${subdomain}:`, error);
    throw error;
  }
};

/**
 * 테넌트 제거 (컨테이너 삭제)
 */
export const removeTenant = async (subdomain) => {
  try {
    console.log(`🗑️  Removing tenant: ${subdomain}`);
    
    // 컨테이너 찾기
    const containers = await docker.listContainers({ all: true });
    const tenantContainers = containers.filter(c => 
      c.Labels['groumo.tenant.subdomain'] === subdomain
    );
    
    // 컨테이너 중지 및 삭제
    for (const containerInfo of tenantContainers) {
      const container = docker.getContainer(containerInfo.Id);
      
      try {
        await container.stop();
      } catch (err) {
        // 이미 중지된 경우 무시
      }
      
      await container.remove();
      console.log(`  ✓ Removed container: ${containerInfo.Names[0]}`);
    }
    
    // TODO: DB 스키마 삭제는 선택적으로 (데이터 백업 후)
    
    console.log(`✅ Tenant removed: ${subdomain}`);
    
    return {
      subdomain,
      removed_containers: tenantContainers.length,
      removed_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`❌ Removal failed for ${subdomain}:`, error);
    throw error;
  }
};

/**
 * Docker 컨테이너 생성 헬퍼
 */
async function createContainer({ name, image, env, labels, network }) {
  // 기존 컨테이너 확인 및 제거
  try {
    const existingContainer = docker.getContainer(name);
    await existingContainer.stop();
    await existingContainer.remove();
  } catch (err) {
    // 없으면 무시
  }
  
  const container = await docker.createContainer({
    name,
    Image: image,
    Env: env,
    Labels: labels,
    HostConfig: {
      NetworkMode: network,
      RestartPolicy: {
        Name: 'unless-stopped'
      }
    }
  });
  
  return container;
}

/**
 * 테넌트 컨테이너 상태 조회
 */
export const getTenantStatus = async (subdomain) => {
  const containers = await docker.listContainers({ all: true });
  const tenantContainers = containers.filter(c => 
    c.Labels['groumo.tenant.subdomain'] === subdomain
  );
  
  return tenantContainers.map(c => ({
    id: c.Id,
    name: c.Names[0],
    image: c.Image,
    state: c.State,
    status: c.Status,
    created: c.Created
  }));
};
