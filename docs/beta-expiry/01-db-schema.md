# 01. DB 스키마 추가

## 현재 DB 구조 (실측)

### `users` 테이블
[V1__create_users.sql](backend/src/main/resources/db/migration/V1__create_users.sql) + [V18__add_user_nickname.sql](backend/src/main/resources/db/migration/V18__add_user_nickname.sql) 적용 후:

```
id, email, name, profile_image,
provider, provider_id,
subscription_type       VARCHAR(20)  NOT NULL DEFAULT 'FREE',
subscription_expires_at TIMESTAMP    NULL,
fcm_token               TEXT,
nickname                VARCHAR(20)  UNIQUE,
created_at, updated_at
```

→ `subscription_type` 은 **PostgreSQL enum type 이 아니라 VARCHAR(20)**. 따라서 `BETA` 값 추가 시 **ALTER TYPE 같은 DB 작업 불필요**. 애플리케이션 `SubscriptionType` enum 에 `BETA` 만 추가하면 됨.

### `subscriptions` 테이블 ([V10](backend/src/main/resources/db/migration/V10__create_subscriptions.sql))
결제 이력 (append-only). 본 작업에선 **건드리지 않음**.

## 추가 필드 (users 테이블)

V24 마이그레이션으로 컬럼 추가:

```sql
-- V24__add_beta_expiry_fields_to_users.sql
ALTER TABLE users
    ADD COLUMN beta_promo_used            BOOLEAN   NOT NULL DEFAULT FALSE,
    ADD COLUMN beta_promo_redeemed_at     TIMESTAMP NULL,
    ADD COLUMN premium_expiry_notified_at JSONB     NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN show_downgrade_modal       BOOLEAN   NOT NULL DEFAULT FALSE;

CREATE INDEX idx_users_beta_subscription_expires_at
    ON users(subscription_expires_at)
    WHERE subscription_type = 'BETA';

COMMENT ON COLUMN users.beta_promo_used            IS '베타 Offer Code 사용 여부 (재발급 차단)';
COMMENT ON COLUMN users.beta_promo_redeemed_at     IS '베타 코드 사용 시점';
COMMENT ON COLUMN users.premium_expiry_notified_at IS '만료 알림 발송 이력 (JSONB)';
COMMENT ON COLUMN users.show_downgrade_modal       IS '자동 강등 후 1회 안내 모달 표시 플래그';
```

> `show_downgrade_modal` 은 05 문서의 강등 결과 모달 트리거용. V24 에 통합 추가.

### 필드 정의

| 컬럼 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `beta_promo_used` | BOOLEAN | FALSE | 베타 코드 사용 여부 (재발급 차단용) |
| `beta_promo_redeemed_at` | TIMESTAMP | NULL | 코드 사용 시점 |
| `premium_expiry_notified_at` | JSONB | `'{}'` | 알림 발송 이력 (중복 발송 방지) |
| `show_downgrade_modal` | BOOLEAN | FALSE | 강등 후 결과 모달 1회 표시 |

### 기존 컬럼 재활용 (변경 없음)

- `subscription_type` → 신규 값 `'BETA'` 추가 (VARCHAR 라 마이그레이션 불필요)
- `subscription_expires_at` → 베타 사용 시 `redeemed_at + 6개월`

## `SubscriptionType` enum 변경

[SubscriptionType.java](backend/src/main/java/com/arrivallab/pawprint/domain/user/entity/SubscriptionType.java):

```java
public enum SubscriptionType {
    FREE, FRIEND, FAMILY, PREMIUM, BETA;   // ← BETA 추가

    public boolean isPaid() {
        return this != FREE;               // BETA 도 unlocked 처리 (기존 == FREE 게이팅 호환)
    }
}
```

`isPaid()` 의미상 BETA 는 결제는 아니지만 **프리미엄 기능 unlocked** 라는 점에서 paid 와 동일. 기존 `@Premium` AOP / `== FREE` 게이팅이 자동으로 BETA 를 unlocked 로 인식.

> `tierFromProductId()` 는 productId 의 "friend"/"family" 패턴 분기로 BETA 와 무관 — 변경 필요 없음. 베타 활성화는 `redeemBetaCode()` 가 직접 `SubscriptionType.BETA` 를 세팅 (02 문서 참고).

## JPA Entity 수정 — [User.java](backend/src/main/java/com/arrivallab/pawprint/domain/user/entity/User.java)

추가 import:
```java
import io.hypersistence.utils.hibernate.type.json.JsonType;
import org.hibernate.annotations.Type;
import java.util.HashMap;
import java.util.Map;
```

필드 추가:
```java
@Column(name = "beta_promo_used", nullable = false)
@Builder.Default
private boolean betaPromoUsed = false;

@Column(name = "beta_promo_redeemed_at")
private LocalDateTime betaPromoRedeemedAt;

@Type(JsonType.class)
@Column(name = "premium_expiry_notified_at", nullable = false, columnDefinition = "jsonb")
@Builder.Default
private Map<String, String> premiumExpiryNotifiedAt = new HashMap<>();

@Column(name = "show_downgrade_modal", nullable = false)
@Builder.Default
private boolean showDowngradeModal = false;
```

베타 활성화·알림 기록용 도메인 메서드 (네이밍은 구현 시 확정):
```java
public void activateBeta(LocalDateTime expiresAt)        { ... }
public void downgradeBetaToFree()                        { ... }
public void ackDowngradeModal()                          { ... }
public void markNotified(String key, LocalDateTime at)   { ... }
public boolean hasNotified(String key)                   { ... }
```

> `hypersistence-utils-hibernate-63:3.7.3` 이 [backend/build.gradle:50](backend/build.gradle#L50) 에 이미 있어서 추가 의존성 X. **프로젝트 내 JSONB 첫 사용처**.

## `premium_expiry_notified_at` JSONB 구조

```json
{
  "d14": "2026-09-01T00:00:00",
  "d7":  null,
  "d1":  null
}
```

값은 ISO 8601 LocalDateTime 문자열. NULL 또는 키 부재면 미발송. 알림 스케줄러는 키 3개 (`d14`, `d7`, `d1`) 만 사용 (03 문서 참고).

## Repository 추가 쿼리 — `UserRepository`

알림 배치·강등 배치에서 사용:
```java
// 만료 임박 사용자 (D-14/D-7/D-1 윈도우) — 알림 배치용
@Query("SELECT u FROM User u "
     + "WHERE u.subscriptionType = :type "
     + "  AND u.subscriptionExpiresAt BETWEEN :from AND :to")
List<User> findBetaExpiringBetween(@Param("type") SubscriptionType type,
                                    @Param("from") LocalDateTime from,
                                    @Param("to") LocalDateTime to);
```

BETA 강등 대상 조회는 기존 [UserRepository.findExpiredBySubscriptionType(BETA, now)](backend/src/main/java/com/arrivallab/pawprint/domain/user/repository/UserRepository.java) 재사용. 상세는 03·05 문서.

## subscriptions 테이블은 건드리지 않음

베타는 결제가 아니라 promo 처리이므로 `subscriptions` 레코드 생성 X. 베타 만료 후 정식 구독으로 전환할 때만 일반 `SubscriptionService.purchase()` 흐름 타며 정상 레코드 생성.

## 작업 절차

1. 본 V24 마이그레이션 파일 작성 (실행 X)
2. `SubscriptionType.java` 에 `BETA` 추가
3. `User.java` 에 필드 4개 + 도메인 메서드 추가
4. `UserRepository` 에 위 쿼리 추가
5. ddl-auto: validate 라서 startup 시 Flyway 가 마이그레이션 적용 → 엔티티 mapping 검증 통과 확인
6. 사용자 승인 후 prod 배포

## 작업 완료 기준

- [ ] V24 마이그레이션 파일 작성 (컬럼 4개 + 인덱스 1개)
- [ ] `SubscriptionType.BETA` 추가
- [ ] `User` 엔티티 필드 4개 + 도메인 메서드
- [ ] `UserRepository` 쿼리 추가
- [ ] 로컬 startup 통과 (Flyway + Hibernate validate)
- [ ] prod 배포 후 `\d users` 로 컬럼 확인

## 절대 변경 금지

- ❌ 기존 `subscription_type`, `subscription_expires_at` 컬럼 구조
- ❌ `subscriptions` 테이블
- ❌ users 의 다른 컬럼
- ❌ 기존 인덱스
