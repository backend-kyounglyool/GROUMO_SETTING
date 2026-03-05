# GROUMO SETTING

그루모 멀티테넌트 시스템 - 관리 플랫폼

## 🏗️ 프로젝트 구조

```
GROUMO_SETTING/
├── admin-api/          # 관리 API 서버 (Node.js/Express)
│   └── 분양 신청 접수/승인, Docker 컨테이너 자동 배포
├── admin-dashboard/    # 관리자 대시보드 (Next.js)
│   └── 신청 목록, 승인/거부, 모니터링
├── landing/            # 분양 신청 페이지 (Next.js)
│   └── 고객용 분양 신청 폼
└── docker-compose.yml  # 로컬 개발 환경
```

## 🚀 기능

### 1. Landing (분양 신청 페이지)
- 회사/기관 정보 입력
- 서브도메인 중복 체크
- 분양 신청서 제출

### 2. Admin API
- 분양 신청 접수 API
- 승인/거부 처리
- Docker 컨테이너 자동 생성
- Supabase 멀티테넌트 DB 관리

### 3. Admin Dashboard
- 신청 목록 조회
- 승인/거부 버튼
- 컨테이너 상태 모니터링
- 사용량 통계

## 🛠️ 기술 스택

- **Backend**: Node.js, Express, Dockerode
- **Frontend**: Next.js 15, React, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Infra**: Docker, Traefik, Watchtower

## 📦 설치 및 실행

### 개발 환경
```bash
# 각 서비스 의존성 설치
cd admin-api && npm install
cd admin-dashboard && npm install
cd landing && npm install

# Docker Compose로 전체 실행
docker-compose up -d
```

### 프로덕션 배포
```bash
# GitHub Actions 자동 배포 (GHCR)
git push origin main
```

## 🌐 도메인 구조

- `groumo.com` - 메인 서비스
- `admin.groumo.com` - 관리자 대시보드
- `apply.groumo.com` - 분양 신청 페이지
- `{tenant}.groumo.com` - 고객 서브도메인

## 📝 환경 변수

각 서비스별 `.env.example` 참고

## 🔗 관련 저장소

- [RANDOM_GROUP](https://github.com/backend-kyounglyool/RANDOM_GROUP) - 메인 애플리케이션
