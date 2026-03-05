import * as tenantService from '../services/tenantService.js';
import * as dockerService from '../services/dockerService.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * 분양 신청 접수
 */
export const applyTenant = async (req, res, next) => {
  try {
    const { 
      organization_name, 
      organization_name_en, 
      organization_type,
      school,
      president_name, 
      contact_phone,
      contact_email
    } = req.body;
    
    // 영문명을 소문자로 변환하여 서브도메인 생성
    const subdomain = organization_name_en.toLowerCase();
    
    // 서브도메인 중복 체크
    const exists = await tenantService.checkSubdomainExists(subdomain);
    if (exists) {
      throw new ApiError('이미 사용 중인 단체 영문명입니다', 409);
    }
    
    // 신청 저장
    const tenant = await tenantService.createTenant({
      organization_name,
      organization_name_en,
      organization_type,
      school,
      subdomain,
      president_name,
      contact_phone,
      contact_email,
      status: 'pending'
    });
    
    res.status(201).json({
      success: true,
      data: tenant,
      message: '분양 신청이 접수되었습니다'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 분양 신청 목록 조회
 */
export const listTenants = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const result = await tenantService.getTenants({
      status,
      page,
      limit
    });
    
    res.json({
      success: true,
      data: result.tenants,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 분양 신청 상세 조회
 */
export const getTenant = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const tenant = await tenantService.getTenantById(id);
    
    if (!tenant) {
      throw new ApiError('신청 내역을 찾을 수 없습니다', 404);
    }
    
    res.json({
      success: true,
      data: tenant
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 분양 신청 승인 + 자동 배포
 */
export const approveTenant = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 신청 내역 조회
    const tenant = await tenantService.getTenantById(id);
    if (!tenant) {
      throw new ApiError('신청 내역을 찾을 수 없습니다', 404);
    }
    
    if (tenant.status !== 'pending') {
      throw new ApiError('대기 중인 신청만 승인할 수 있습니다', 400);
    }
    
    // 승인 상태로 변경
    await tenantService.updateTenantStatus(id, 'approved');
    
    // Docker 컨테이너 자동 배포
    try {
      const deployment = await dockerService.deployTenant({
        tenantId: id,
        subdomain: tenant.subdomain,
        organizationName: tenant.organization_name
      });
      
      // 배포 완료 상태로 변경
      await tenantService.updateTenantStatus(id, 'deployed', {
        deployed_at: new Date().toISOString(),
        deployment_info: deployment
      });
      
      res.json({
        success: true,
        message: '승인 및 배포가 완료되었습니다',
        data: {
          tenant: await tenantService.getTenantById(id),
          deployment
        }
      });
    } catch (deployError) {
      // 배포 실패 시 에러 기록
      await tenantService.updateTenantStatus(id, 'approved', {
        deployment_error: deployError.message
      });
      
      throw new ApiError(`승인되었으나 배포 실패: ${deployError.message}`, 500);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 분양 신청 거부
 */
export const rejectTenant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const tenant = await tenantService.getTenantById(id);
    if (!tenant) {
      throw new ApiError('신청 내역을 찾을 수 없습니다', 404);
    }
    
    await tenantService.updateTenantStatus(id, 'rejected', {
      rejected_at: new Date().toISOString(),
      rejection_reason: reason
    });
    
    res.json({
      success: true,
      message: '신청이 거부되었습니다',
      data: await tenantService.getTenantById(id)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 테넌트 삭제 (컨테이너 포함)
 */
export const deleteTenant = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const tenant = await tenantService.getTenantById(id);
    if (!tenant) {
      throw new ApiError('신청 내역을 찾을 수 없습니다', 404);
    }
    
    // 배포된 테넌트라면 컨테이너 삭제
    if (tenant.status === 'deployed') {
      await dockerService.removeTenant(tenant.subdomain);
    }
    
    // DB에서 삭제
    await tenantService.deleteTenant(id);
    
    res.json({
      success: true,
      message: '테넌트가 삭제되었습니다'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 서브도메인 중복 체크
 */
export const checkSubdomain = async (req, res, next) => {
  try {
    const { subdomain } = req.body;
    
    const exists = await tenantService.checkSubdomainExists(subdomain);
    
    res.json({
      success: true,
      available: !exists,
      subdomain
    });
  } catch (error) {
    next(error);
  }
};
