import express from 'express';
import { body, param, query } from 'express-validator';
import * as tenantController from '../controllers/tenantController.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

/**
 * POST /api/tenants/apply
 * 분양 신청 접수
 */
router.post('/apply',
  [
    body('organization_name').trim().notEmpty().withMessage('단체명은 필수입니다'),
    body('organization_name_en')
      .trim()
      .notEmpty().withMessage('단체 영문명은 필수입니다')
      .matches(/^[a-zA-Z0-9-]+$/).withMessage('단체 영문명은 영문, 숫자, 하이픈만 가능합니다')
      .isLength({ min: 2, max: 50 }).withMessage('단체 영문명은 2-50자여야 합니다'),
    body('organization_type')
      .trim()
      .notEmpty().withMessage('단체 종류는 필수입니다')
      .isIn(['중앙동아리', '가등록동아리', '소모임', '스터디', '연합동아리', '학생회', '기타'])
      .withMessage('유효한 단체 종류를 선택하세요'),
    body('school').optional().trim(),
    body('president_name').trim().notEmpty().withMessage('회장 이름은 필수입니다'),
    body('contact_phone').trim().notEmpty().withMessage('연락처는 필수입니다'),
    body('contact_email').optional().trim().isEmail().withMessage('유효한 이메일을 입력하세요')
  ],
  validate,
  tenantController.applyTenant
);

/**
 * GET /api/tenants
 * 분양 신청 목록 조회
 */
router.get('/',
  [
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'deployed']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  tenantController.listTenants
);

/**
 * GET /api/tenants/:id
 * 분양 신청 상세 조회
 */
router.get('/:id',
  [
    param('id').isUUID().withMessage('유효한 ID를 입력하세요')
  ],
  validate,
  tenantController.getTenant
);

/**
 * PUT /api/tenants/:id/approve
 * 분양 신청 승인 (자동 배포)
 */
router.put('/:id/approve',
  [
    param('id').isUUID().withMessage('유효한 ID를 입력하세요')
  ],
  validate,
  tenantController.approveTenant
);

/**
 * PUT /api/tenants/:id/reject
 * 분양 신청 거부
 */
router.put('/:id/reject',
  [
    param('id').isUUID().withMessage('유효한 ID를 입력하세요'),
    body('reason').optional().trim()
  ],
  validate,
  tenantController.rejectTenant
);

/**
 * DELETE /api/tenants/:id
 * 테넌트 삭제 (컨테이너 포함)
 */
router.delete('/:id',
  [
    param('id').isUUID().withMessage('유효한 ID를 입력하세요')
  ],
  validate,
  tenantController.deleteTenant
);

/**
 * POST /api/tenants/:subdomain/check
 * 서브도메인 중복 체크
 */
router.post('/check/subdomain',
  [
    body('subdomain')
      .trim()
      .notEmpty()
      .matches(/^[a-z0-9-]+$/)
  ],
  validate,
  tenantController.checkSubdomain
);

export default router;
