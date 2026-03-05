import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantModule } from './tenant/tenant.module';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { DockerModule } from './docker/docker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    DockerModule,
    TenantModule,
    HealthModule,
  ],
})
export class AppModule {}
