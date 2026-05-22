# 05. 자동 무료 전환 배치

## 작업 범위

만료일에 도달한 BETA 사용자를 FREE 로 자동 강등. **기존 [SubscriptionExpiryScheduler.expireSubscriptions()](backend/src/main/java/com/arrivallab/pawprint/domain/subscription/scheduler/SubscriptionExpiryScheduler.java) 에 BETA 분기 추가**.

## 현재 코드 (변경 전)

```java
@Scheduled(cron = "0 0 1 * * *")
@Transactional
public void expireSubscriptions() {
    List<User> expired = userRepository.findExpiredBySubscriptionType(
            SubscriptionType.PREMIUM, LocalDateTime.now());
    for (User user : expired) {
        user.updateSubscription(SubscriptionType.FREE, null);
        log.info("Subscription expired: userId={}", user.getId());
    }
    if (!expired.isEmpty()) {
        log.info("Expired {} premium subscriptions", expired.size());
    }
}
```

→ 현재는 PREMIUM 만 강등. FRIEND/FAMILY 도 강등 대상이지만 본 문서 범위 아님 — **BETA 만 추가**.

## 변경 후 (의도)

```java
@Scheduled(cron = "0 0 1 * * *")
@Transactional
public void expireSubscriptions() {
    LocalDateTime now = LocalDateTime.now();
    expireLegacyPremium(now);
    expireBeta(now);
}

private void expireLegacyPremium(LocalDateTime now) {
    List<User> expired = userRepository.findExpiredBySubscriptionType(
            SubscriptionType.PREMIUM, now);
    for (User user : expired) {
        user.updateSubscription(SubscriptionType.FREE, null);
        log.info("Subscription expired (PREMIUM): userId={}", user.getId());
    }
    if (!expired.isEmpty()) log.info("Expired {} legacy premium subscriptions", expired.size());
}

private void expireBeta(LocalDateTime now) {
    List<User> expired = userRepository.findExpiredBySubscriptionType(
            SubscriptionType.BETA, now);
    for (User user : expired) {
        user.downgradeBetaToFree();        // 도메인 메서드 — 아래 정의
        log.info("Subscription expired (BETA): userId={}", user.getId());
    }
    if (!expired.isEmpty()) log.info("Expired {} beta subscriptions", expired.size());
}
```

## `User.downgradeBetaToFree()` 도메인 메서드

```java
public void downgradeBetaToFree() {
    this.subscriptionType = SubscriptionType.FREE;
    this.subscriptionExpiresAt = null;
    this.showDowngradeModal = true;   // 강등 후 1회 안내 (옵션 A)
    // beta_promo_used 는 유지 — 재발급 차단
}
```

`updateSubscription(FREE, null)` 직접 호출하지 않는 이유: 강등은 자연 만료 (강등 모달 표시 필요) 인데 일반 `updateSubscription` 은 결제 흐름에서도 쓰여서 의미가 다름. 메서드 분리해서 의도 명확화.

## 결과 모달 트리거 — 옵션 A 채택

원본 docs 의 두 옵션 중:
- **옵션 A**: `users.show_downgrade_modal BOOLEAN` 필드 — 강등 시 true, 클라이언트 ack 시 false ← **채택**
- 옵션 B: 별도 알림 테이블 — 현재 프로젝트에 인앱 알림 테이블 없음. 신설 부담 큼

### 추가 마이그레이션 — V24 에 통합 (01 문서 반영 완료)

`show_downgrade_modal BOOLEAN NOT NULL DEFAULT FALSE` 컬럼은 01 문서의 V24 마이그레이션에 통합 추가됨.

### ack 엔드포인트

```
POST /api/subscriptions/downgrade-modal/ack
Authorization: Bearer
```
→ `user.show_downgrade_modal = false` 로 세팅. 응답은 `SubscriptionStatusResponse`.

[SubscriptionController](backend/src/main/java/com/arrivallab/pawprint/domain/subscription/controller/SubscriptionController.java) + [SubscriptionService](backend/src/main/java/com/arrivallab/pawprint/domain/subscription/service/SubscriptionService.java) 에 메서드 추가:
```java
// Controller
@PostMapping("/downgrade-modal/ack")
public ResponseEntity<ApiResponse<SubscriptionStatusResponse>> ackDowngradeModal(
        @AuthenticationPrincipal UserDetails userDetails) { ... }

// Service
public SubscriptionStatusResponse ackDowngradeModal(Long userId) {
    User user = getUser(userId);
    user.ackDowngradeModal();   // show_downgrade_modal = false
    return SubscriptionStatusResponse.from(user);
}
```

## 베타 → 정식 구독 전환된 사용자

베타 사용자가 만료 전에 `purchase()` 호출해서 FRIEND/FAMILY/PREMIUM 으로 전환되면 `subscriptionType` 이 BETA 가 아니라서 `expireBeta()` 쿼리에서 자동 제외. 추가 필터 불필요.

## 알림 배치와의 순서

| 시각 (KST) | 작업 |
|---|---|
| 00:00 | `PremiumExpiryNotificationScheduler.sendExpiryNotifications()` — D-1 사용자에게 푸시 |
| 01:00 | `SubscriptionExpiryScheduler.expireSubscriptions()` — D+0 사용자 강등 |

D-1 알림이 자정에 발송되고, 그 다음 정각 (실제 만료 시점) 에 강등. 사용자 입장에선 자정 직후 "내일 종료돼요" 푸시 → 다음 날 새벽 1시에 무료 전환 → 다음 앱 진입 시 `show_downgrade_modal = true` 로 결과 모달.

## 작업 완료 기준

- [ ] `SubscriptionExpiryScheduler.expireSubscriptions()` 에 `expireBeta()` 분기 추가
- [ ] `User.downgradeBetaToFree()` / `ackDowngradeModal()` 도메인 메서드
- [ ] `users.show_downgrade_modal` 컬럼 (01 문서의 V24 에 포함됨)
- [ ] `POST /api/subscriptions/downgrade-modal/ack` 엔드포인트
- [ ] `SubscriptionStatusResponse.showDowngradeModal` 필드 (04 문서)
- [ ] 단위 테스트 (만료 사용자 강등 + 모달 플래그)

## 절대 변경 금지

- ❌ 기존 `expireLegacyPremium()` (현 `expireSubscriptions()` 본문) 로직
- ❌ `cleanRotatedTokens()` 메서드
- ❌ cron 스케줄 (`"0 0 1 * * *"`)
- ❌ `User.updateSubscription()` 시그니처 — 결제 흐름에서 계속 사용
