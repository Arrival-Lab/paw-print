# 00. 베타 만료 흐름 — 개요 & 환경

베타 테스터에게 6개월 무료 프리미엄 → 만료 전 단계별 알림 (D-14/D-7/D-1) → 만료 시 자동 무료 강등 (사용자가 정식 결제 안 한 경우). 본 폴더의 문서들은 백엔드 작업 단위로 쪼개진 설계 노트.

> **정책 변경 메모 (2026-05-22)**: 베타 한정 할인 쿠폰 정책 전면 제거. 06 문서는 deprecated. `beta_discount_eligible_until` 컬럼, D+27 알림, `/api/subscriptions/pricing` 모두 폐기.

## 결정 사항 (재논의 X)

1. **`SubscriptionType` enum 에 `BETA` 5번째 tier 추가** (FREE / FRIEND / FAMILY / PREMIUM / BETA).
2. **만료 강등은 `SubscriptionExpiryScheduler` 에 통합** — 별도 스케줄러 없음. 매일 새벽 1시 (`cron "0 0 1 * * *"`) 같은 시점에서 PREMIUM·BETA 모두 검사.
3. **알림 발송 스케줄러는 신규** — `PremiumExpiryNotificationScheduler` 매일 자정 KST. D-14 / D-7 / D-1 처리.
4. **베타 redeem 은 `SubscriptionService.redeemBetaCode()` 메서드로 추가** — 별도 서비스 X. 발자국의 "도메인 단위 서비스 묶음" 패턴 유지.
5. **App Store Server Notifications webhook 도입 안 함** — 현재 패턴 (클라이언트 `restore` 재호출) 유지. 베타 → 정식 전환도 동일하게 `SubscriptionService.purchase()` 호출.

## 환경 (실제 코드 기준)

| 항목 | 값 |
|---|---|
| 백엔드 | Spring Boot 3.3 + Java 17 |
| DB | PostgreSQL 18 (AWS RDS) |
| ORM | Spring Data JPA + Hibernate 6.5 |
| 마이그레이션 | Flyway (`db/migration/V*.sql`) — **현재 마지막 V23** |
| JSONB | `io.hypersistence:hypersistence-utils-hibernate-63:3.7.3` (이미 [backend/build.gradle:50](backend/build.gradle#L50) 에 설치됨, 사용처는 본 작업이 첫 사용) |
| Push | **Expo Push Service** (`https://exp.host/--/api/v2/push/send`) — 클래스명은 `FcmService` 호환 유지. 본 문서들에서 "FCM" 이라 적힌 부분은 모두 Expo Push 의미 |
| OAuth | Google OAuth2 (Spring Security `oauth2-client`) |
| IAP 검증 | Apple `verifyReceipt` REST + Google `AndroidPublisher` SDK |
| 스케줄러 | Spring `@Scheduled` (`@EnableScheduling` 활성) |
| 시크릿 | **AWS Secrets Manager 사용 안 함** — ECS Fargate task definition 환경변수로 주입. `application-prod.yml` 은 `${ENV_VAR}` 치환만 |
| 배포 | `main` push → ECS Fargate 자동 배포, startup 시 Flyway 실행 |

## 패키지 구조 (관련 부분만)

```
com.arrivallab.pawprint.domain
├── user
│   ├── entity/User.java                 ← 베타 만료 필드 4개 추가
│   ├── entity/SubscriptionType.java     ← BETA 값 추가
│   ├── repository/UserRepository.java   ← 만료 조회 쿼리 추가
│   └── service/UserService.java
├── subscription
│   ├── controller/SubscriptionController.java   ← /redeem-offer-code 추가
│   ├── service/SubscriptionService.java         ← redeemBetaCode() 추가
│   ├── entity/{Subscription, SubscriptionPlatform, SubscriptionStatus}.java
│   ├── repository/SubscriptionRepository.java
│   ├── scheduler/SubscriptionExpiryScheduler.java   ← BETA 분기 추가
│   └── (신규) scheduler/PremiumExpiryNotificationScheduler.java
└── ...

com.arrivallab.pawprint.infra.fcm.FcmService    ← Expo Push (호출 시그니처 유지)
```

## 기존 핵심 흐름 (변경 영향 파악용)

**IAP 검증·DB 갱신**:
```
POST /api/subscriptions/purchase|restore
  → SubscriptionController
  → SubscriptionService.purchase()
    → verify() → verifyIos() or verifyAndroid()
    → activateSubscription()
      → SubscriptionRepository.save(Subscription)
      → User.updateSubscription(type, expiresAt)   # users 테이블 캐시 갱신
```

**구독 상태 조회**:
```
GET /api/subscriptions/status
  → SubscriptionStatusResponse { subscriptionType, expiresAt, isActive }
```

**만료 강등 (현재)**: [SubscriptionExpiryScheduler.expireSubscriptions()](backend/src/main/java/com/arrivallab/pawprint/domain/subscription/scheduler/SubscriptionExpiryScheduler.java) 매일 새벽 1시. 현재는 **`SubscriptionType.PREMIUM` 만** 검사 → FREE 강등. FRIEND/FAMILY 강등 로직 없음. 본 작업으로 BETA 분기 추가.

**Push 발송**: [FcmService.sendPushNotification(token, title, body, data, categoryId)](backend/src/main/java/com/arrivallab/pawprint/infra/fcm/FcmService.java). 토큰은 `User.fcmToken` 컬럼 (Expo `ExponentPushToken[...]`). 빈 토큰이면 자동 스킵.

## 문서 인덱스

| # | 내용 |
|---|---|
| 01 | DB 스키마 (V24 마이그레이션, User 엔티티 필드, JSONB) |
| 02 | Offer Code redeem (`SubscriptionService.redeemBetaCode()`) |
| 03 | 만료 알림 배치 (`PremiumExpiryNotificationScheduler`) |
| 04 | Premium status API (기존 `/status` 확장 vs 신규 비교) |
| 05 | 자동 무료 강등 (기존 `SubscriptionExpiryScheduler` 에 BETA 분기) |
| ~~06~~ | ~~할인 쿠폰~~ — **deprecated**, 정책 제거 |
| 07 | 클라이언트 (React Native) 작업 — 별도 세션 권장 |
| 99 | 테스트 시나리오 |

## 절대 규칙

- ❌ 기존 IAP 검증 로직 (`verifyIos`/`verifyAndroid`) 리팩토링 금지 — 분기만 추가
- ❌ 기존 `subscription_type` / `subscription_expires_at` 컬럼 구조 변경 금지
- ❌ 새 의존성 추가 금지 — `hypersistence-utils` 이미 있음
- ❌ App Store Server Notifications webhook 도입 금지
- ❌ 시크릿을 application.yml 에 하드코딩 금지 — ECS env 만
