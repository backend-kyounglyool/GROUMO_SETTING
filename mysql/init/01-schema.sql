-- GROUMO 분양 신청 테이블

CREATE DATABASE IF NOT EXISTS groumo;
USE groumo;

CREATE TABLE tenants (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

  -- 단체 정보
  organization_name VARCHAR(255) NOT NULL,
  organization_name_en VARCHAR(255) NOT NULL,
  organization_type VARCHAR(50) NOT NULL,
  school VARCHAR(255) DEFAULT NULL,

  -- 서브도메인 (영문명 기반)
  subdomain VARCHAR(50) NOT NULL UNIQUE,

  -- 회장/담당자 정보
  president_name VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  contact_email VARCHAR(255) DEFAULT NULL,

  -- 상태 관리
  status ENUM('pending', 'approved', 'rejected', 'deployed') DEFAULT 'pending',

  -- 배포 정보
  deployed_at DATETIME DEFAULT NULL,
  deployment_info JSON DEFAULT NULL,
  deployment_error TEXT DEFAULT NULL,

  -- 거부 정보
  rejected_at DATETIME DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL,

  -- 메타 정보
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- 인덱스
  INDEX idx_status (status),
  INDEX idx_subdomain (subdomain),
  INDEX idx_organization_type (organization_type),
  INDEX idx_created_at (created_at DESC)
);
