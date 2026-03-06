# Shared Backend Architecture

## 🏗️ 구조

### 전체 아키텍처
```
groumo.com (메인)
├── Backend (Spring Boot)  ← 공유 Backend
└── Frontend (Next.js)

test.groumo.com (테넌트)
└── Frontend (Next.js)  ← 각 테넌트마다 Frontend만 배포

abc.groumo.com (테넌트)
└── Frontend (Next.js)

xyz.groumo.com (테넌트)
└── Frontend (Next.js)
```

**모든 테넌트가 groumo.com의 Backend를 공유**합니다.

---

## 🔄 배포 프로세스

### 1. 분양 신청 승인 시

```typescript
// Admin API (GROUMO_SETTING)
1. tenant_test 스키마 생성
2. tenant_test.groups 테이블에 조직 정보 insert  ✅
3. Frontend 컨테이너만 생성 (test-frontend)
4. test.groumo.com → test-frontend 라우팅
```

### 2. 배포되는 것

**생성되는 것:**
- ✅ Frontend 컨테이너: `test-frontend`
- ✅ DB 스키마: `tenant_test`
- ✅ groups 테이블 데이터

**생성되지 않는 것:**
- ❌ Backend 컨테이너 (공유 Backend 사용)

---

## 📡 API 통신

### Frontend 설정
```env
# test-frontend 컨테이너
NEXT_PUBLIC_API_URL=https://groumo.com/api  ← 공유 Backend
TENANT_ID=d219ede3-359b-4b59-8200-c7ea3cb2b9ab
SUBDOMAIN=test
```

### API 요청 흐름
```
1. test.groumo.com (Frontend)
   ↓
2. https://groumo.com/api (공유 Backend)
   ↓
3. X-Tenant-ID 헤더로 tenant 식별
   ↓
4. tenant_test 스키마의 데이터 조회
```

---

## 🔑 Tenant 식별

### Frontend에서 자동으로 헤더 추가

```typescript
// lib/api.ts
const TENANT_ID = process.env.TENANT_ID || '';

export async function fetchAPI(url: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': TENANT_ID,  // 환경변수에서 자동 주입
    ...options.headers,
  };
  
  return fetch(url, { ...options, headers });
}
```

### Backend에서 Tenant 식별

**Spring Boot 예시:**

```java
@RestController
public class GroupController {
    
    @GetMapping("/api/group/current")
    public ResponseEntity<Group> getCurrentGroup(
        @RequestHeader("X-Tenant-ID") String tenantId
    ) {
        // 1. 헤더에서 tenantId 읽기
        // 2. tenants 테이블에서 subdomain, schema 조회
        Tenant tenant = tenantRepository.findById(tenantId);
        String schema = tenant.getDbSchema();  // "tenant_test"
        
        // 3. 해당 스키마에서 group 조회
        Group group = groupRepository.findById(schema, tenantId);
        
        return ResponseEntity.ok(group);
    }
}
```

---

## 🗄️ 데이터베이스 구조

### 공통 스키마 (public)
```sql
-- Admin API가 관리
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    subdomain VARCHAR(50) UNIQUE,
    organization_name VARCHAR(255),
    db_schema VARCHAR(100),  -- "tenant_test"
    status VARCHAR(50),
    ...
);
```

### 테넌트 스키마 (tenant_test)
```sql
-- 각 테넌트마다 독립 스키마
CREATE SCHEMA tenant_test;

CREATE TABLE tenant_test.groups (
    id UUID PRIMARY KEY,  -- TENANT_ID
    name VARCHAR(255),    -- 조직명
    description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE tenant_test.users (...);
CREATE TABLE tenant_test.events (...);
-- ... 기타 테이블들
```

---

## 🔧 Backend 동적 스키마 설정

### 방법 1: JPA/Hibernate (추천)

**TenantContext 구현:**
```java
@Component
public class TenantContext {
    private static ThreadLocal<String> currentSchema = new ThreadLocal<>();
    
    public static void setSchema(String schema) {
        currentSchema.set(schema);
    }
    
    public static String getSchema() {
        return currentSchema.get();
    }
    
    public static void clear() {
        currentSchema.remove();
    }
}
```

**Interceptor로 자동 설정:**
```java
@Component
public class TenantInterceptor implements HandlerInterceptor {
    
    @Autowired
    private TenantRepository tenantRepository;
    
    @Override
    public boolean preHandle(
        HttpServletRequest request, 
        HttpServletResponse response, 
        Object handler
    ) {
        String tenantId = request.getHeader("X-Tenant-ID");
        
        if (tenantId != null) {
            Tenant tenant = tenantRepository.findById(UUID.fromString(tenantId))
                .orElseThrow(() -> new NotFoundException("Tenant not found"));
            
            TenantContext.setSchema(tenant.getDbSchema());
        }
        
        return true;
    }
    
    @Override
    public void afterCompletion(...) {
        TenantContext.clear();
    }
}
```

**Repository에서 사용:**
```java
@Repository
public class GroupRepository {
    
    @Autowired
    private EntityManager entityManager;
    
    public Group findById(UUID id) {
        String schema = TenantContext.getSchema();
        
        Query query = entityManager.createNativeQuery(
            "SELECT * FROM \"" + schema + "\".groups WHERE id = :id",
            Group.class
        );
        query.setParameter("id", id);
        
        return (Group) query.getSingleResult();
    }
}
```

### 방법 2: JDBC Template

```java
@Repository
public class GroupRepository {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    public Group findByIdInSchema(String schema, UUID id) {
        String sql = "SELECT * FROM \"" + schema + "\".groups WHERE id = ?";
        
        return jdbcTemplate.queryForObject(
            sql,
            new BeanPropertyRowMapper<>(Group.class),
            id
        );
    }
}
```

---

## ✅ 장점

### 1. 리소스 절약
- Backend 컨테이너 1개만 실행 (테넌트 수 무관)
- 메모리/CPU 효율적

### 2. 관리 편의
- Backend 업데이트 시 한 곳만 배포
- 버그 수정 시 즉시 모든 테넌트에 반영

### 3. 비용 절감
- 서버 리소스 최소화
- Docker 이미지 1개만 관리

---

## ⚠️ 주의사항

### 1. Backend는 반드시 Tenant 식별 필요
- 모든 API에서 `X-Tenant-ID` 헤더 확인
- 잘못된 tenant의 데이터 접근 방지

### 2. 성능 모니터링
- 공유 Backend에 부하 집중
- 필요 시 Backend Scale-out (여러 인스턴스 실행)

### 3. 장애 격리
- Backend 장애 시 모든 테넌트 영향
- Health check 및 모니터링 필수

---

## 🚀 배포 예시

### 테넌트 승인 시
```bash
# Admin API 로그
📦 Creating database schema: tenant_test
✅ Schema created: tenant_test
📝 Initializing tenant data for: tenant_test
✅ Tenant data initialized
🚀 Deploying Frontend only for: test
✅ Tenant deployed: test (Frontend only, shared Backend)
```

### 배포 후 구조
```bash
docker ps
# groumo-backend       (공유)
# groumo-frontend      (메인)
# test-frontend        (test 테넌트)
# abc-frontend         (abc 테넌트)
# xyz-frontend         (xyz 테넌트)
```

---

## 📋 요약

1. **Backend는 groumo.com에서 공유**
2. **각 테넌트는 Frontend만 배포**
3. **Admin API가 배포 시 DB에 직접 group 데이터 insert**
4. **Frontend는 X-Tenant-ID 헤더로 자신을 식별**
5. **Backend는 헤더 기반으로 동적 스키마 변경**

이제 각 서브도메인에서 공유 Backend를 사용하면서도 독립적인 데이터를 관리할 수 있습니다! 🎉
