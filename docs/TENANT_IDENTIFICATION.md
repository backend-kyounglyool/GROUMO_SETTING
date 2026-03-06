# Tenant 식별 가이드

## 🎯 개요

각 서브도메인별로 배포된 테넌트가 자신의 단체 정보를 조회하는 방법

---

## 📦 배포 시 자동으로 추가되는 것

### 1. 환경변수
각 테넌트 컨테이너(Backend/Frontend)에 자동으로 주입됩니다:

```env
TENANT_ID=d219ede3-359b-4b59-8200-c7ea3cb2b9ab
SUBDOMAIN=test
ORGANIZATION_NAME=박경률 신청 테스트
```

### 2. DB 스키마
- 스키마명: `tenant_{subdomain}` (예: `tenant_test`)
- `groups` 테이블에 단체 정보 자동 insert:
  ```sql
  INSERT INTO tenant_test.groups (id, name, description)
  VALUES (
    '{TENANT_ID}',
    '{단체명}',
    '{단체 종류} - {학교}\n영문명: {영문명}\n서브도메인: {subdomain}'
  );
  ```

---

## 🔧 Backend에서 Current Tenant 조회

### 방법 1: 환경변수 사용 (추천)

**Spring Boot 예시:**
```java
@Component
public class TenantContext {
    @Value("${TENANT_ID}")
    private String tenantId;
    
    @Value("${SUBDOMAIN}")
    private String subdomain;
    
    @Value("${DB_SCHEMA}")
    private String schema;
    
    public String getTenantId() {
        return tenantId;
    }
    
    public String getSubdomain() {
        return subdomain;
    }
    
    public String getSchema() {
        return schema;
    }
}
```

**서비스에서 사용:**
```java
@Service
public class GroupService {
    @Autowired
    private TenantContext tenantContext;
    
    public Group getCurrentGroup() {
        String schema = tenantContext.getSchema();
        String tenantId = tenantContext.getTenantId();
        
        // 현재 테넌트의 group 조회
        return jdbcTemplate.queryForObject(
            "SELECT * FROM \"" + schema + "\".groups WHERE id = ?",
            new BeanPropertyRowMapper<>(Group.class),
            UUID.fromString(tenantId)
        );
    }
}
```

---

### 방법 2: 요청 헤더 사용

**Frontend에서 자동으로 헤더 추가:**
```typescript
// lib/api.ts
const TENANT_ID = process.env.TENANT_ID || '';

export async function fetchAPI(url: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': TENANT_ID,
    ...options.headers,
  };
  
  const response = await fetch(url, { ...options, headers });
  return response.json();
}
```

**Backend에서 헤더 읽기 (Spring Boot):**
```java
@RestController
public class GroupController {
    
    @GetMapping("/api/group/current")
    public ResponseEntity<Group> getCurrentGroup(
        @RequestHeader("X-Tenant-ID") String tenantId
    ) {
        // 헤더에서 받은 tenantId로 조회
        Group group = groupService.getGroupById(tenantId);
        return ResponseEntity.ok(group);
    }
}
```

---

## 🗄️ DB 쿼리 시 스키마 분리

### JPA/Hibernate 동적 스키마 설정

```java
@Configuration
public class HibernateConfig {
    @Value("${DB_SCHEMA}")
    private String schema;
    
    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory() {
        // ... 기본 설정
        
        Properties properties = new Properties();
        properties.setProperty("hibernate.default_schema", schema);
        
        factory.setJpaProperties(properties);
        return factory;
    }
}
```

### JDBC Template으로 스키마 동적 사용

```java
@Repository
public class GroupRepository {
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Value("${DB_SCHEMA}")
    private String schema;
    
    public Group findById(UUID id) {
        String sql = "SELECT * FROM \"" + schema + "\".groups WHERE id = ?";
        return jdbcTemplate.queryForObject(sql, 
            new BeanPropertyRowMapper<>(Group.class), 
            id
        );
    }
    
    public List<Group> findAll() {
        String sql = "SELECT * FROM \"" + schema + "\".groups";
        return jdbcTemplate.query(sql, 
            new BeanPropertyRowMapper<>(Group.class)
        );
    }
}
```

---

## ✅ 검증 방법

### 1. 환경변수 확인
```bash
# 컨테이너 내부에서
docker exec test-backend printenv | grep TENANT
```

**출력 예시:**
```
TENANT_ID=d219ede3-359b-4b59-8200-c7ea3cb2b9ab
SUBDOMAIN=test
ORGANIZATION_NAME=박경률 신청 테스트
DB_SCHEMA=tenant_test
```

### 2. DB 확인
```sql
-- 스키마 존재 확인
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%';

-- group 데이터 확인
SELECT * FROM tenant_test.groups;
```

**출력 예시:**
```
id                                   | name                  | description
-------------------------------------+-----------------------+------------------
d219ede3-359b-4b59-8200-c7ea3cb2b9ab | 박경률 신청 테스트    | 중앙동아리 - 인하대학교
                                     |                       | 영문명: test
                                     |                       | 서브도메인: test
```

---

## 🚀 실제 사용 예시

### 현재 단체 정보 조회 API

```java
@RestController
@RequestMapping("/api/organization")
public class OrganizationController {
    
    @Autowired
    private TenantContext tenantContext;
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @GetMapping("/current")
    public ResponseEntity<Organization> getCurrentOrganization() {
        String schema = tenantContext.getSchema();
        String tenantId = tenantContext.getTenantId();
        
        String sql = "SELECT * FROM \"" + schema + "\".groups WHERE id = ?";
        
        Organization org = jdbcTemplate.queryForObject(
            sql,
            (rs, rowNum) -> {
                Organization o = new Organization();
                o.setId(UUID.fromString(rs.getString("id")));
                o.setName(rs.getString("name"));
                o.setDescription(rs.getString("description"));
                o.setCreatedAt(rs.getTimestamp("created_at"));
                return o;
            },
            UUID.fromString(tenantId)
        );
        
        return ResponseEntity.ok(org);
    }
}
```

**Frontend에서 호출:**
```typescript
// app/organization/page.tsx
const response = await fetch('/api/organization/current');
const organization = await response.json();

console.log(organization.name); // "박경률 신청 테스트"
```

---

## 📋 요약

1. **환경변수 자동 주입**: `TENANT_ID`, `SUBDOMAIN`, `DB_SCHEMA`
2. **DB 초기 데이터**: `groups` 테이블에 단체 정보 자동 추가
3. **Backend 조회**: 환경변수 또는 헤더로 Current Tenant 식별
4. **스키마 분리**: 각 tenant는 독립된 스키마 사용

이제 각 서브도메인에서 자신의 단체 정보를 자동으로 조회할 수 있습니다! 🎉
