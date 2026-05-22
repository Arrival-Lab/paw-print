# 03. 만료 알림 배치 시스템

## 작업 범위

신규 스케줄러 클래스 — **`PremiumExpiryNotificationScheduler`** — 매일 자정 (KST) 실행, BETA 만료 임박 사용자에게 Expo Push 알림 + 인앱 표시용 플래그.

> 본 폴더의 "FCM" 표현은 모두 **Expo Push** 의미. 클래스명은 [FcmService](backend/src/main/java/com/arrivallab/pawprint/infra/fcm/FcmService.java) 그대로 사용.

## 위치

[backend/src/main/java/com/arrivallab/pawprint/domain/subscription/scheduler/PremiumExpiryNotificationScheduler.java](backend/src/main/java/com/arrivallab/pawprint/domain/subscription/scheduler/PremiumExpiryNotificationScheduler.java) (신규)

기존 패턴 ([CareReminderScheduler](backend/src/main/java/com/arrivallab/pawprint/domain/care/scheduler/CareReminderScheduler.java), [VaccineAlertScheduler](backend/src/main/java/com/arrivallab/pawprint/domain/vaccine/scheduler/VaccineAlertScheduler.java)) 따름:
- `@Component` + `@RequiredArgsConstructor` + `@Slf4j`
- `@Scheduled(cron = "...", zone = "Asia/Seoul")`
- `@Transactional` (notified flag 갱신 필요)
- 의존성: `UserRepository`, `FcmService`

## 알림 시점 3단계

| 시점 | 푸시 | 인앱 배너 | 인앱 모달 | notified 키 |
|---|---|---|---|---|
| D-14 | ❌ | ✅ info     | ❌ | `d14` |
| D-7  | ✅ 1회 | ✅ warning  | ❌ | `d7` |
| D-1  | ✅ 1회 | ✅ critical | ✅ | `d1` |

- 인앱 배너·모달은 클라이언트가 `/api/subscriptions/status` 응답 (04 문서) 으로 판단. 배치는 푸시 + 알림 이력 기록만 담당.
- D-14 는 푸시 X 라서 배치에서 처리할 일은 `notified.d14` 기록뿐 → 클라이언트 배너 표시 추적용. 실용상 D-14 도 배치에서 한 줄로 처리.

## 실행 시각

```java
@Scheduled(cron = "0 0 0 * * *", zone = "Asia/Seoul")  // 매일 자정 KST
@Transactional
public void sendExpiryNotifications() { ... }
```

> 강등 배치 (05 문서, `SubscriptionExpiryScheduler.expireSubscriptions()`) 는 새벽 1시. **알림 → 강등** 순서. D-Day 사용자가 자정 직후 알림 받고 1시에 강등됨.

## 윈도우 쿼리

각 시점별로 `[targetStart, targetEnd)` 1일 윈도우. KST 기준 `LocalDate.now(ZoneId.of("Asia/Seoul"))` 사용.

```java
LocalDate today = LocalDate.now(KST);

// D-14: subscription_expires_at ∈ [today+14, today+15)
notify(today.plusDays(14), today.plusDays(15), "d14", false);

// D-7
notify(today.plusDays(7),  today.plusDays(8),  "d7",  true);

// D-1
notify(today.plusDays(1),  today.plusDays(2),  "d1",  true);
```

세 시점 모두 `User.subscriptionType = BETA AND subscriptionExpiresAt BETWEEN ?from AND ?to` 로 조회.

레포 쿼리는 01 문서 참고:
- `UserRepository.findBetaExpiringBetween(SubscriptionType.BETA, from, to)`

## 중복 발송 방지

각 사용자별 `premium_expiry_notified_at` JSONB 키 확인:
```java
if (user.hasNotified("d7")) continue;
fcmService.sendPushNotification(user.getFcmToken(), title, body, data, "PREMIUM_EXPIRY");
user.markNotified("d7", LocalDateTime.now());
```

도메인 메서드 `hasNotified` / `markNotified` 는 01 문서.

## Expo Push payload

`FcmService.sendPushNotification(token, title, body, data, categoryId)` 호출.

### `categoryId`
- `PREMIUM_EXPIRY` — 클라이언트가 `setNotificationCategoryAsync` 로 등록 (07 문서)

### `data` 필드
```java
Map.of(
    "type", "PREMIUM_EXPIRY",
    "stage", "d7"        // 또는 "d1", "discount_expiring"
)
```

### 푸시 문구

**D-7**
```
title: 발자국 프리미엄이 곧 종료돼요
body : 7일 후 베타 프리미엄이 종료됩니다. 계속 이용하시려면 멤버십을 확인해주세요.
```

**D-1**
```
title: 내일 프리미엄이 종료돼요
body : 계속 이용하시려면 앱에서 멤버십을 확인해주세요.
```

## 푸시 토큰 없는 경우

기존 패턴 ([VaccineAlertScheduler:48-52](backend/src/main/java/com/arrivallab/pawprint/domain/vaccine/scheduler/VaccineAlertScheduler.java#L48-L52)) 따라 `FcmService` 가 빈 토큰을 알아서 스킵 + WARN 로깅. 별도 처리 X.

> 토큰이 없어도 `notified` 키는 기록해야 할까?
> → **기록.** 다음 날 토큰 등록되면 다시 발송하는 게 더 어색. 클라이언트는 인앱 배너로 동일 정보 노출 (04 문서) 하므로 사용자가 놓치지 않음.

## 이미 정식 구독 시작한 사용자 제외

베타 사용자가 만료 전에 `purchase()` 호출해서 BETA → FRIEND/FAMILY/PREMIUM 로 전환되면 `subscriptionType` 이 BETA 가 아니라서 윈도우 쿼리에서 자동 제외됨. 추가 필터 불필요.

## 로깅

기존 스케줄러 패턴 따름:
```
log.info("PremiumExpiry: {} users due for {} at {}", batch.size(), stage, today);
log.info("PremiumExpiry dispatch: userId={} stage={} tokenLen={}", u.getId(), stage, len);
log.warn("PremiumExpiry skip: userId={} reason=...", u.getId());
```

## 작업 완료 기준

- [ ] `PremiumExpiryNotificationScheduler` 클래스 생성
- [ ] 3개 시점별 윈도우 쿼리·발송 로직
- [ ] `UserRepository.findBetaExpiringBetween` 쿼리 (01 문서)
- [ ] `User.hasNotified` / `markNotified` 도메인 메서드 (01 문서)
- [ ] Expo Push categoryId `PREMIUM_EXPIRY` 정의
- [ ] 클라이언트 `setNotificationCategoryAsync("PREMIUM_EXPIRY", ...)` 등록 (07 문서)
- [ ] 단위 테스트 (mock `Clock` 또는 윈도우 파라미터 직접 주입)

## 절대 변경 금지

- ❌ `FcmService` 클래스 (Expo Push 호출 시그니처 유지)
- ❌ `SubscriptionExpiryScheduler` 의 `cleanRotatedTokens()` / `expireSubscriptions()` (05 문서에서 별도 처리)
- ❌ 기존 스케줄러 (Care, Vaccine) 로직
