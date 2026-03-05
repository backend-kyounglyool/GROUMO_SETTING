import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { DockerService } from '../docker/docker.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ApplyTenantDto } from './dto/apply-tenant.dto';
import { CheckSubdomainDto } from './dto/check-subdomain.dto';
import { RejectTenantDto } from './dto/reject-tenant.dto';
import { ListTenantsQueryDto } from './dto/list-tenants-query.dto';

@Controller('api/tenants')
@UseGuards(ApiKeyGuard)
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly dockerService: DockerService,
  ) {}

  @Post('apply')
  @HttpCode(HttpStatus.CREATED)
  async apply(@Body() dto: ApplyTenantDto) {
    const subdomain = dto.organization_name_en.toLowerCase();

    const exists = await this.tenantService.checkSubdomainExists(subdomain);
    if (exists) {
      throw new ConflictException('이미 사용 중인 단체 영문명입니다');
    }

    const tenant = await this.tenantService.createTenant({
      organization_name: dto.organization_name,
      organization_name_en: dto.organization_name_en,
      organization_type: dto.organization_type,
      school: dto.school,
      subdomain,
      president_name: dto.president_name,
      contact_phone: dto.contact_phone,
      contact_email: dto.contact_email,
      status: 'pending',
    });

    return {
      success: true,
      data: tenant,
      message: '분양 신청이 접수되었습니다',
    };
  }

  @Get()
  async list(@Query() query: ListTenantsQueryDto) {
    const result = await this.tenantService.getTenants({
      status: query.status,
      page: query.page!,
      limit: query.limit!,
    });

    return {
      success: true,
      data: result.tenants,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const tenant = await this.tenantService.getTenantById(id);
    if (!tenant) {
      throw new NotFoundException('신청 내역을 찾을 수 없습니다');
    }

    return { success: true, data: tenant };
  }

  @Put(':id/approve')
  async approve(@Param('id', ParseUUIDPipe) id: string) {
    const tenant = await this.tenantService.getTenantById(id);
    if (!tenant) {
      throw new NotFoundException('신청 내역을 찾을 수 없습니다');
    }

    if (tenant.status !== 'pending') {
      throw new BadRequestException('대기 중인 신청만 승인할 수 있습니다');
    }

    await this.tenantService.updateTenantStatus(id, 'approved');

    try {
      const deployment = await this.dockerService.deployTenant({
        tenantId: id,
        subdomain: tenant.subdomain,
        organizationName: tenant.organization_name,
      });

      await this.tenantService.updateTenantStatus(id, 'deployed', {
        deployed_at: new Date().toISOString(),
        deployment_info: deployment,
      });

      return {
        success: true,
        message: '승인 및 배포가 완료되었습니다',
        data: {
          tenant: await this.tenantService.getTenantById(id),
          deployment,
        },
      };
    } catch (deployError: any) {
      await this.tenantService.updateTenantStatus(id, 'approved', {
        deployment_error: deployError.message,
      });

      throw new InternalServerErrorException(
        `승인되었으나 배포 실패: ${deployError.message}`,
      );
    }
  }

  @Put(':id/reject')
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectTenantDto,
  ) {
    const tenant = await this.tenantService.getTenantById(id);
    if (!tenant) {
      throw new NotFoundException('신청 내역을 찾을 수 없습니다');
    }

    await this.tenantService.updateTenantStatus(id, 'rejected', {
      rejected_at: new Date().toISOString(),
      rejection_reason: dto.reason,
    });

    return {
      success: true,
      message: '신청이 거부되었습니다',
      data: await this.tenantService.getTenantById(id),
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const tenant = await this.tenantService.getTenantById(id);
    if (!tenant) {
      throw new NotFoundException('신청 내역을 찾을 수 없습니다');
    }

    if (tenant.status === 'deployed') {
      await this.dockerService.removeTenant(tenant.subdomain);
    }

    await this.tenantService.deleteTenant(id);

    return { success: true, message: '테넌트가 삭제되었습니다' };
  }

  @Post('check/subdomain')
  async checkSubdomain(@Body() dto: CheckSubdomainDto) {
    const exists = await this.tenantService.checkSubdomainExists(dto.subdomain);

    return {
      success: true,
      available: !exists,
      subdomain: dto.subdomain,
    };
  }
}
