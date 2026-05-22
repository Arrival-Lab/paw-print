# 99. 테스트 시나리오

구현 완료 후 다음 시나리오가 모두 동작해야 함.

## 1. Offer Code Redeem (`SubscriptionService.redeemBetaCode`)

- [ ] 베타 코드 사용 → `subscription_type = BETA`, `subscription_expires_at = now + 6개월`
- [ ] `beta_promo_used = true`, `beta_promo_redeemed_at = now`
- [ ] 중복 redeem 시 `BETA_PROMO_ALREADY_REDEEMED` (409) 반환
- [ ] 동일 `transaction_id` 재사용 시 `PURCHASE_VERIFICATION_FAILED` 반환
- [ ] Apple 영수증 검증 실패 시 `PURCHASE_VERIFICATION_FAILED`
- [ ] iOS 가 아닌 platform 으로 호출 시 거부
- [ ] `subscriptions` 테이블에 레코드 생성되지 **않음** (베타는 promo)

## 2. 알림 발송 (`PremiumExpiryNotificationScheduler`)

- [ ] D-14 (만료일이 today+14 인 BETA 사용자) → `premium_expiry_notified_at.d14` 기록만, 푸시 X
- [ ] D-7  → Expo Push 1회 + `notified.d7` 기록
- [ ] D-1  → Expo Push 1회 + `notified.d1` 기록
- [ ] 동일 시점 재실행 시 `notified.{key}` 채워져 있어 중복 발송 안 됨
- [ ] `fcm_token` 이 null/blank 이면 푸시 스킵 + WARN 로그, `notified.{key}` 는 기록
- [ ] 정식 구독 전환된 사용자 (`subscription_type != BETA`) 는 윈도우 쿼리에서 자동 제외
- [ ] Expo Push 호출 시 `categoryId="PREMIUM_EXPIRY"`, `data.type="PREMIUM_EXPIRY"`, `data.stage="d7"|"d1"`

## 3. 자동 강등 (`SubscriptionExpiryScheduler.expireSubscriptions` — BETA 분기)

- [ ] `subscription_expires_at < now` 인 BETA 사용자 → `subscription_type = FREE`, `expires_at = null`
- [ ] `show_downgrade_modal = true` 로 세팅
- [ ] `beta_promo_used` 는 유지 (재발급 차단 영구)
- [ ] 기존 PREMIUM 강등 로직 (`expireLegacyPremium`) 동작 유지 — 회귀 없음
- [ ] 매일 새벽 1시 KST 실행 — cron 변경 없음

## 4. 사용자 선택 시나리오

### A. D-1 모달에서 "프리미엄 계속하기"
- [ ] 정상가 결제 화면 진입 (할인 분기 X)
- [ ] 결제 후 `POST /api/subscriptions/purchase` → `subscription_type = FAMILY` (등) 로 덮어씀
- [ ] `subscriptions` 테이블에 정상 레코드 추가
- [ ] `beta_promo_used` 는 유지 (재발급 차단 통계용)

### B. D-1 모달에서 "무료 플랜으로 전환"
- [ ] 토스트 노출 후 모달 닫기 (즉시 강등 API 는 없음 — 만료일에 배치가 자동 처리)
- [ ] D-Day 알림 (D-1 푸시) 은 이미 발송됐을 수 있음

### C. 사용자가 아무것도 안 함 (디폴트)
- [ ] 만료 시점 (새벽 1시) 에 자동 강등 → `show_downgrade_modal = true`
- [ ] 다음 진입 시 `/api/subscriptions/status` 응답에 `showDowngradeModal: true`
- [ ] 클라이언트가 결과 모달 표시
- [ ] 모달 ack → `POST /api/subscriptions/downgrade-modal/ack` → `show_downgrade_modal = false`
- [ ] 이후 호출엔 `showDowngradeModal: false`

## 5. 상태 API (`/api/subscriptions/status` 확장)

- [ ] D-14: `subscriptionType="BETA"`, `expiryBannerType="D14"`, `showExpiryModal=false`, `showDowngradeModal=false`
- [ ] D-7:  `expiryBannerType="D7"`
- [ ] D-1:  `expiryBannerType="D1"`, `showExpiryModal=true`
- [ ] D+1 (자동 강등 후 첫 진입):  `subscriptionType="FREE"`, `expiryBannerType=null`, `showDowngradeModal=true`
- [ ] ack 후: `showDowngradeModal=false`
- [ ] 기존 클라이언트 (베타 필드 모르는) 호환 — `subscriptionType`/`expiresAt`/`isActive` 응답 그대로

## 6. 엣지 케이스

- [ ] 베타 코드 사용 후 즉시 정식 구독 결제 → `purchase()` 가 BETA → FAMILY 등 덮어씀, `beta_promo_used` 는 true 유지
- [ ] 베타 기간 중 앱 삭제 후 재설치 → JWT 재발급, `/status` 로 상태 복원
- [ ] 모든 시점은 **KST 기준** (`@Scheduled(zone = "Asia/Seoul")`, `LocalDate.now(KST)`)
- [ ] Expo Push 발송 실패 → 기존 `FcmService` 패턴대로 ERROR 로그만 남기고 무시
- [ ] V24 마이그레이션이 베타 사용자 0명인 상태에서 적용 가능 (DEFAULT 값 안전)

## 7. Mock 시간 테스트

Spring `Clock` 빈 주입 또는 윈도우 파라미터 직접 주입 패턴.

`PremiumExpiryNotificationScheduler` 의 윈도우 계산 로직을 별도 메서드로 분리하면 mock 없이 파라미터 테스트 가능 — 권장 패턴:
```java
void sendExpiryNotificationsAt(LocalDate today) { ... }   // 테스트에서 직접 호출
@Scheduled(...) void sendExpiryNotifications() {
    sendExpiryNotificationsAt(LocalDate.now(KST));
}
```

실시간 통합 테스트는 수동 — TestFlight 빌드에서 DB `subscription_expires_at` 을 직접 조정해 확인.

## 8. 코드 위치 체크리스트

구현 완료 시 다음 위치에 변경이 들어가 있어야:

| 파일 | 변경 |
|---|---|
| `db/migration/V24__add_beta_expiry_fields_to_users.sql` | 신규 — 컬럼 4개 (`beta_promo_used`, `beta_promo_redeemed_at`, `premium_expiry_notified_at`, `show_downgrade_modal`) + 인덱스 1개 |
| `domain/user/entity/SubscriptionType.java` | `BETA` 추가 |
| `domain/user/entity/User.java` | 필드 4개 + 도메인 메서드 (`activateBeta`, `downgradeBetaToFree`, `ackDowngradeModal`, `hasNotified`, `markNotified`) |
| `domain/user/repository/UserRepository.java` | 윈도우 쿼리 (`findBetaExpiringBetween`) |
| `domain/subscription/service/SubscriptionService.java` | `redeemBetaCode()`, `ackDowngradeModal()` |
| `domain/subscription/controller/SubscriptionController.java` | 엔드포인트 2개 (`/redeem-offer-code`, `/downgrade-modal/ack`) |
| `domain/subscription/dto/SubscriptionStatusResponse.java` | 필드 4개 추가 |
| `domain/subscription/dto/BetaRedeemRequest.java` | 신규 |
| `domain/subscription/dto/ExpiryBannerType.java` | 신규 enum |
| `domain/subscription/scheduler/SubscriptionExpiryScheduler.java` | `expireBeta()` 분기 추가 |
| `domain/subscription/scheduler/PremiumExpiryNotificationScheduler.java` | 신규 |
| `global/exception/ErrorCode.java` | `BETA_PROMO_ALREADY_REDEEMED` 추가 |
| `BetaPromoProperties` (`@ConfigurationProperties("beta.promo")`) | 신규 — `premiumMonths` 만 |
| `application-prod.yml` | `beta.promo.premium-months` 환경변수 |
