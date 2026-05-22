# 01. DB 스키마 추가 (실제 DB 구조 반영)

## 현재 DB 구조 파악 결과

### users 테이블 (현재 상태 캐시)
```
subscription_type       VARCHAR(20) DEFAULT 'FREE'
subscription_expires_at TIMESTAMP NULL
```
→ 현재 플랜 상태를 빠르게 조회하기 위한 캐시 컬럼.

### subscriptions 테이블 (결제 이력)
```
id, user_id, platform, product_id, purchase_token, 
status, started_at, expires_at, created_at, updated_at, transaction_id
```
→ Apple/Google 결제 이력 저장용. Append-only 성격.

## 설계 결정: 베타 만료 필드는 users 테이블에 추가

### 이유
1. **subscriptions는 결제 이력 테이블**. 베타 무료 코드는 결제가 아니므로 의미상 부적합
2. **현재 상태 조회 일관성**. users만 보면 현재 플랜 알 수 있는 구조 유지
3. **subscription_type에 'BETA' 값 추가하면 자연스럽게 분기 가능**

## 추가 필드

`users` 테이블에 다음 컬럼 추가:

```sql
ALTER TABLE users ADD COLUMN beta_promo_used BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN beta_promo_redeemed_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN beta_discount_eligible_until TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN premium_expiry_notified_at JSONB NOT NULL DEFAULT '{}'::jsonb;
```

### 필드 정의

| 필드명 | 타입 | 기본값 | 설명 |
|--------|------|--------|------|
| `beta_promo_used` | BOOLEAN | FALSE | 베타 Offer Code 사용 여부 |
| `beta_promo_redeemed_at` | TIMESTAMP | NULL | 코드 사용 시점 |
| `beta_discount_eligible_until` | TIMESTAMP | NULL | 할인 쿠폰 유효 만료일 (premium만료 + 30일) |
| `premium_expiry_notified_at` | JSONB | `'{}'` | 알림 발송 이력 |

### 기존 컬럼 활용 (변경 없음)

- `subscription_type`: 'FREE' / 'PREMIUM' / **'BETA'** (신규 값 추가)
- `subscription_expires_at`: 베타 사용 시 redeemed_at + 6개월로 설정

→ **기존 컬럼 구조 변경 X**. 'BETA' 값만 새로 사용.

## subscriptions 테이블은 건드리지 않음

베타는 결제가 아니라 코드 redeem이므로 subscriptions 테이블에 레코드 생성 X.

다만 베타 만료 후 사용자가 **정식 구독으로 전환 시**에는 일반 결제 흐름 따름 → subscriptions에 정상 레코드 생성.

## premium_expiry_notified_at JSONB 구조

```json
{
  "d14": "2026-09-01T00:00:00Z",
  "d7": null,
  "d1": null,
  "discount_expiring": null
}
```

발송 시각을 ISO 8601 문자열로 저장. NULL이면 미발송.

## Flyway 마이그레이션 파일

프로젝트는 Flyway 사용 중 (`flyway_schema_history` 테이블 확인).

### 파일명
`src/main/resources/db/migration/V{다음번호}__add_beta_expiry_fields_to_users.sql`

> 현재 마지막 마이그레이션 버전 확인 후 다음 번호 사용:
> ```sql
> SELECT version FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;
> ```

### 마이그레이션 SQL

```sql
-- V{N}__add_beta_expiry_fields_to_users.sql

ALTER TABLE users 
    ADD COLUMN beta_promo_used BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN beta_promo_redeemed_at TIMESTAMP NULL,
    ADD COLUMN beta_discount_eligible_until TIMESTAMP NULL,
    ADD COLUMN premium_expiry_notified_at JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 인덱스: 만료 알림 배치에서 자주 쿼리되는 컬럼
CREATE INDEX idx_users_subscription_expires_at 
    ON users(subscription_expires_at) 
    WHERE subscription_type = 'BETA';

-- 인덱스: 할인 쿠폰 만료 알림 쿼리용
CREATE INDEX idx_users_beta_discount_eligible_until 
    ON users(beta_discount_eligible_until) 
    WHERE beta_discount_eligible_until IS NOT NULL;

COMMENT ON COLUMN users.beta_promo_used IS '베타 Offer Code 사용 여부';
COMMENT ON COLUMN users.beta_promo_redeemed_at IS '베타 코드 사용 시점';
COMMENT ON COLUMN users.beta_discount_eligible_until IS '베타 테스터 전용 할인 쿠폰 유효 만료일';
COMMENT ON COLUMN users.premium_expiry_notified_at IS '만료 알림 발송 이력 (JSONB)';
```

### 롤백 SQL (참고용, Flyway는 기본적으로 down migration 안 함)

```sql
DROP INDEX IF EXISTS idx_users_subscription_expires_at;
DROP INDEX IF EXISTS idx_users_beta_discount_eligible_until;

ALTER TABLE users 
    DROP COLUMN IF EXISTS beta_promo_used,
    DROP COLUMN IF EXISTS beta_promo_redeemed_at,
    DROP COLUMN IF EXISTS beta_discount_eligible_until,
    DROP COLUMN IF EXISTS premium_expiry_notified_at;
```

## JPA Entity 수정

`User.java` (또는 해당 엔터티 파일)에 필드 추가:

```java
@Column(name = "beta_promo_used", nullable = false)
private boolean betaPromoUsed = false;

@Column(name = "beta_promo_redeemed_at")
private LocalDateTime betaPromoRedeemedAt;

@Column(name = "beta_discount_eligible_until")
private LocalDateTime betaDiscountEligibleUntil;

@Type(JsonType.class)
@Column(name = "premium_expiry_notified_at", columnDefinition = "jsonb")
private Map<String, String> premiumExpiryNotifiedAt = new HashMap<>();
```

> JSONB 타입을 위해 `hypersistence-utils` 라이브러리가 필요할 수 있음. 이미 설치되어있는지 build.gradle 확인.

## 작업 절차

1. **현재 Flyway 마이그레이션 마지막 버전 확인**
   ```sql
   SELECT version FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;
   ```

2. **마이그레이션 파일 작성** (실행 X)

3. **User 엔터티 수정**

4. **사용자 검토 후 마이그레이션 실행**
   - 로컬 또는 dev 환경에서 먼저 테스트
   - production은 백업 후 실행
   - 실행 방법:
     - 앱 재시작 시 Flyway 자동 실행 (현재 설정 따름)
     - 또는 수동: `./gradlew flywayMigrate`

5. **변경 확인**
   ```bash
   pawprint-db
   ```
   ```sql
   \d users
   ```
   새 컬럼 4개 보이는지 확인.

## 절대 변경 금지

- ❌ 기존 `subscription_type`, `subscription_expires_at` 컬럼 구조 변경
- ❌ `subscriptions` 테이블 변경
- ❌ `users` 테이블의 다른 컬럼 변경
- ❌ 기존 인덱스 변경

새 컬럼 4개만 추가. 그 외 기존 스키마 보존.

## 작업 완료 기준

- [ ] Flyway 마지막 버전 확인
- [ ] 마이그레이션 파일 작성
- [ ] User 엔터티 수정
- [ ] 마이그레이션 실행 (사용자 승인 후)
- [ ] 컬럼 추가 확인
- [ ] 인덱스 생성 확인