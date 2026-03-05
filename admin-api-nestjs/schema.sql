-- GROUMO 분양 신청 테이블

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 단체 정보
  organization_name VARCHAR(255) NOT NULL,           -- 단체명
  organization_name_en VARCHAR(255) NOT NULL,        -- 단체 영문명
  organization_type VARCHAR(50) NOT NULL,            -- 단체 종류
  school VARCHAR(255),                                -- 학교 (선택)
  
  -- 서브도메인 (영문명 기반)
  subdomain VARCHAR(50) UNIQUE NOT NULL,
  
  -- 회장/담당자 정보
  president_name VARCHAR(255) NOT NULL,              -- 회장
  contact_phone VARCHAR(50) NOT NULL,                -- 연락처
  contact_email VARCHAR(255),                        -- 이메일 (선택)
  
  -- 상태 관리
  status VARCHAR(50) DEFAULT 'pending',              -- pending, approved, rejected, deployed
  
  -- 배포 정보
  deployed_at TIMESTAMP WITH TIME ZONE,
  deployment_info JSONB,
  deployment_error TEXT,
  
  -- 거부 정보
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- 메타 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_organization_type ON tenants(organization_type);
CREATE INDEX idx_tenants_created_at ON tenants(created_at DESC);

-- 단체 종류 체크 제약
ALTER TABLE tenants 
ADD CONSTRAINT chk_organization_type 
CHECK (organization_type IN (
  '중앙동아리',
  '가등록동아리',
  '소모임',
  '스터디',
  '연합동아리',
  '학생회',
  '기타'
));

-- 상태 체크 제약
ALTER TABLE tenants 
ADD CONSTRAINT chk_status 
CHECK (status IN ('pending', 'approved', 'rejected', 'deployed'));

-- 코멘트
COMMENT ON TABLE tenants IS '그루모 분양 신청 테이블';
COMMENT ON COLUMN tenants.organization_name IS '단체명 (한글)';
COMMENT ON COLUMN tenants.organization_name_en IS '단체 영문명 (서브도메인 기준)';
COMMENT ON COLUMN tenants.organization_type IS '단체 종류';
COMMENT ON COLUMN tenants.school IS '학교 (선택사항)';
COMMENT ON COLUMN tenants.subdomain IS '서브도메인 (예: abc → abc.groumo.com)';
COMMENT ON COLUMN tenants.president_name IS '회장 이름';
COMMENT ON COLUMN tenants.contact_phone IS '연락처';
