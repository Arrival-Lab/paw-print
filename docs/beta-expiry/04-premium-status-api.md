# 04. Premium Status API

## 작업 범위

클라이언트가 앱 진입 시 호출하는 엔드포인트. 베타 만료 임박 시 인앱 배너/모달 표시 여부 + 베타 할인 가능 여부 판단.

## 결정: **기존 `/api/subscriptions/status` 를 확장**

### 옵션 비교

| | A. 기존 `/status` 확장 | B. 신규 `/api/users/premium-status` |
|---|---|---|
| 호환성 | 기존 클라이언트가 추가 필드 무시하면 OK | 별도 엔드포인트 → 두 군데 호출 필요 |
| 도메인 위치 | subscription 도메인 | user 도메인이지만 실제는 구독 상태 |
| Single Source of Truth | ✅ 구독 상태는 한 곳에서만 | 두 엔드포인트 응답 일관성 부담 |
| 응답 크기 | 베타 만료 필드가 모든 사용자에게 nullable 로 추가됨 | 베타 사용자만 호출 가능 |
| 캐싱 | 기존 staleTime 그대로 | 별도 키 관리 |

### → A 선택 (기존 확장)
- 발자국은 도메인 단위 서비스 묶음 패턴이라 구독 상태는 `subscription` 한 곳에서 관리
- 베타 만료 필드가 null 이어도 클라이언트가 쉽게 분기 가능 (`expiryBannerType == null` 이면 미표시)
- React Query 키 하나로 모든 구독 정보 통합

## 엔드포인트

```
GET /api/subscriptions/status
Authorization: Bearer {jwt}
```

[SubscriptionController.getStatus()](backend/src/main/java/com/arrivallab/pawprint/domain/subscription/controller/SubscriptionController.java) 그대로 유지. 응답 DTO 만 확장.

## 확장된 `SubscriptionStatusResponse`

[SubscriptionStatusResponse.java](backend/src/main/java/com/arrivallab/pawprint/domain/subscription/dto/SubscriptionStatusResponse.java) 의 record 에 베타 필드 추가:

```java
public record SubscriptionStatusResponse(
        SubscriptionType subscriptionType,        // 기존
        LocalDateTime    expiresAt,               // 기존
        boolean          isActive,                // 기존
        // ── 베타 만료 흐름용 (BETA 가 아니면 모두 null/false) ──
        Integer          daysUntilExpiry,         // 만료까지 남은 일수 (KST 기준)
        ExpiryBannerType expiryBannerType,        // d14 | d7 | d1 | null
        boolean          showExpiryModal,         // D-1 자동 모달 트리거
        boolean          showDowngradeModal       // 무료 강등 후 1회 안내 (05 문서)
) {
    public static SubscriptionStatusResponse from(User user) { ... }
}
```

### `ExpiryBannerType` enum
```java
public enum ExpiryBannerType { D14, D7, D1 }
```
Jackson 직렬화 시 `"D14"` → 클라이언트는 lowercase 변환 필요. 또는 `@JsonValue` 로 `"d14"` 강제. 컨벤션은 구현 시 통일.

### 필드 도출 로직

`from(User user)` 정적 팩토리 안에서:
```
LocalDate today = LocalDate.now(KST)
LocalDate expiry = user.subscriptionExpiresAt → toLocalDate()

daysUntilExpiry =
    subscriptionType == BETA && expiry != null
    ? ChronoUnit.DAYS.between(today, expiry)
    : null

expiryBannerType =
    subscriptionType != BETA          → null
    daysUntilExpiry == null  || < 0   → null
    daysUntilExpiry <= 1              → D1
    daysUntilExpiry <= 7              → D7
    daysUntilExpiry <= 14             → D14
    else                              → null

showExpiryModal = (expiryBannerType == D1)
                  && !user.hasNotified("d1_modal_acked")   ← 클라이언트 ack 후 false

showDowngradeModal = user.showDowngradeModal   ← 05 문서에서 정의
```

## D-1 모달 중복 표시 방지

옵션 두 가지:
1. **서버 관리** — `premium_expiry_notified_at.d1_modal_acked` 키에 사용자 ack 시각 기록. 별도 ack 엔드포인트 (`POST /api/subscriptions/expiry-modal/ack`) 필요.
2. **클라이언트 관리** — AsyncStorage 에 `d1_modal_shown=true` 저장. 서버는 항상 `showExpiryModal: true` (D-1 윈도우 동안) 반환.

→ **클라이언트 관리 (옵션 2)** 추천. 발자국 클라이언트는 이미 MMKV 사용 중이고 D-1 모달은 UX 가벼움. 서버 라운드트립 줄임.

(원본 docs 의 옵션 1 도 유효하지만 본 문서는 옵션 2 기준.)

## Response 예시

### BETA D-7
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "subscriptionType": "BETA",
    "expiresAt": "2026-05-29T12:00:00",
    "isActive": true,
    "daysUntilExpiry": 7,
    "expiryBannerType": "d7",
    "showExpiryModal": false,
    "showDowngradeModal": false
  }
}
```

### FREE (자동 강등 후 첫 진입)
```json
{
  "data": {
    "subscriptionType": "FREE",
    "expiresAt": null,
    "isActive": false,
    "daysUntilExpiry": null,
    "expiryBannerType": null,
    "showExpiryModal": false,
    "showDowngradeModal": true
  }
}
```

### FRIEND / FAMILY / PREMIUM (베타 아님)
```json
{
  "data": {
    "subscriptionType": "FAMILY",
    "expiresAt": "2026-06-22T12:00:00",
    "isActive": true,
    "daysUntilExpiry": null,
    "expiryBannerType": null,
    "showExpiryModal": false,
    "showDowngradeModal": false
  }
}
```

> `daysUntilExpiry` / `expiryBannerType` 은 BETA 한정. 유료 tier 의 만료일 카운트다운은 본 작업 범위 아님.

## 호환성

- 기존 클라이언트는 추가 필드를 무시 → 회귀 없음
- 신규 클라이언트는 추가 필드 활용
- `subscriptionType` 이 `"BETA"` 값을 받게 됨 → 클라이언트가 enum 처리할 때 미지원 값 대비 필요 (현재 `frontend/features/subscription/` 확인 필요, 07 문서 참고)

## 작업 완료 기준

- [ ] `SubscriptionStatusResponse` 에 필드 4개 추가 (`daysUntilExpiry`, `expiryBannerType`, `showExpiryModal`, `showDowngradeModal`)
- [ ] `ExpiryBannerType` enum 정의
- [ ] `from(User)` 정적 팩토리에 도출 로직
- [ ] 단위 테스트 (시점별 응답)
- [ ] 클라이언트 타입 동기화 (07 문서)

## 절대 변경 금지

- ❌ 기존 `/api/subscriptions/status` URL
- ❌ `SubscriptionController.getStatus()` 시그니처
- ❌ 기존 응답 필드 (`subscriptionType`, `expiresAt`, `isActive`)
