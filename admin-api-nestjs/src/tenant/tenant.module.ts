import { Module } from '@nestjs/common';
import { TenantController, PublicTenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { DockerModule } from '../docker/docker.module';

@Module({
  imports: [DockerModule],
  controllers: [TenantController, PublicTenantController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
