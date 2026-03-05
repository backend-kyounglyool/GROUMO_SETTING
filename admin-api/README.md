# GROUMO Admin API

관리 API 서버 - 분양 신청 접수, 승인, Docker 컨테이너 자동 배포

## 🚀 기능

- ✅ 분양 신청 접수 API
- ✅ 서브도메인 중복 체크
- ✅ 신청 승인/거부
- ✅ Docker 컨테이너 자동 생성 및 배포
- ✅ Supabase 멀티테넌트 스키마 관리
- ✅ Traefik 자동 라우팅 설정

## 📦 설치

```bash
npm install
```

## 🔧 환경 변수

`.env` 파일 생성 (`.env.example` 참고):

```env
PORT=5000
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DB_HOST=your-db-host
DB_PASSWORD=your-db-password
ADMIN_API_KEY=your-secure-api-key
```

## 🏃 실행

### 개발 모드
```bash
npm run dev
```

### 프로덕션
```bash
npm start
```

### Docker
```bash
docker build -t groumo-admin-api .
docker run -p 5000:5000 --env-file .env groumo-admin-api
```

## 📡 API 엔드포인트

모든 API 요청에는 `X-API-Key` 헤더 필요 (health 제외)

### Health Check
```
GET /health
```

### 분양 신청
```
POST /api/tenants/apply
Content-Type: application/json
X-API-Key: your-api-key

{
  "company": "ACME Corp",
  "subdomain": "acme",
  "contact_name": "홍길동",
  "contact_email": "contact@acme.com",
  "contact_phone": "010-1234-5678",
  "description": "회사 소개"
}
```

### 서브도메인 중복 체크
```
POST /api/tenants/check/subdomain
X-API-Key: your-api-key

{
  "subdomain": "acme"
}
```

### 신청 목록 조회
```
GET /api/tenants?status=pending&page=1&limit=20
X-API-Key: your-api-key
```

### 신청 상세 조회
```
GET /api/tenants/:id
X-API-Key: your-api-key
```

### 승인 (자동 배포)
```
PUT /api/tenants/:id/approve
X-API-Key: your-api-key
```

### 거부
```
PUT /api/tenants/:id/reject
X-API-Key: your-api-key

{
  "reason": "거부 사유"
}
```

### 삭제
```
DELETE /api/tenants/:id
X-API-Key: your-api-key
```

## 🏗️ 배포 프로세스

승인 시 자동으로:
1. ✅ Supabase에 테넌트 전용 스키마 생성
2. ✅ Backend 컨테이너 생성 (Spring Boot)
3. ✅ Frontend 컨테이너 생성 (Next.js)
4. ✅ Traefik 라벨 설정 (자동 라우팅 + SSL)
5. ✅ 컨테이너 시작
6. ✅ 상태 업데이트

## 🔒 보안

- API Key 인증
- Helmet.js (보안 헤더)
- CORS 제한
- Input validation (express-validator)

## 📝 TODO

- [ ] 이메일 알림 (승인/거부 시)
- [ ] 웹훅 지원
- [ ] 사용량 모니터링
- [ ] 로그 수집 및 분석
