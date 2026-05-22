# 02. Apple Offer Code Redeem 처리

## 작업 범위

iOS 클라이언트가 베타 Offer Code 를 StoreKit 으로 redeem → 영수증을 서버로 전송 → 서버가 Apple `verifyReceipt` 로 검증 → 6개월 무료 BETA 프리미엄 활성화.

## 흐름

```
iOS: 사용자 코드 입력 → StoreKit presentCodeRedemptionSheet → 영수증 획득
  ↓
POST /api/subscriptions/redeem-offer-code   (Authorization: Bearer)
  ↓
SubscriptionController.redeemOfferCode()
  ↓
SubscriptionService.redeemBetaCode(userId, request)
  ├─ verifyIos(receiptData)                ← 기존 메서드 재사용. 변경 X
  ├─ beta_promo_used 중복 체크
  ├─ subscriptionRepository.existsByTransactionId(...)  ← 중복 영수증 차단
  └─ user.activateBeta(expiresAt, discountUntil)        ← 신규 도메인 메서드
```

> **기존 `verifyIos()` / `verifyAndroid()` / `purchase()` 는 절대 리팩토링 X.** 베타용 진입점만 `redeemBetaCode()` 로 추가하고 검증은 기존 메서드 재사용.

## 신규 메서드: `SubscriptionService.redeemBetaCode()`

[SubscriptionService.java](backend/src/main/java/com/arrivallab/pawprint/domain/subscription/service/SubscriptionService.java) 에 메서드 추가:

```java
public SubscriptionStatusResponse redeemBetaCode(Long userId, BetaRedeemRequest request) {
    User user = getUser(userId);

    if (user.isBetaPromoUsed()) {
        throw new BusinessException(ErrorCode.BETA_PROMO_ALREADY_REDEEMED);
    }

    // Apple 영수증 검증 — 기존 메서드 재사용
    VerifyResult result = verifyIos(request.receipt());

    if (subscriptionRepository.existsByTransactionId(result.transactionId())) {
        throw new BusinessException(ErrorCode.PURCHASE_VERIFICATION_FAILED);
    }

    LocalDateTime now = LocalDateTime.now();
    LocalDateTime expiresAt = now.plusMonths(BETA_PROMO_PREMIUM_MONTHS);

    user.activateBeta(expiresAt);   // 도메인 메서드 (01 문서)
    // subscriptions 테이블엔 레코드 X — 베타는 결제가 아니라 promo
    return SubscriptionStatusResponse.from(user);
}
```

`activateBeta(expiresAt)` 도메인 메서드는 내부에서:
- `subscriptionType = BETA`
- `subscriptionExpiresAt = expiresAt`
- `betaPromoUsed = true`
- `betaPromoRedeemedAt = now()`

설정 일괄.

> **iOS 한정.** Android 베타 배포는 별도. `request.platform` 검증 단계에서 IOS 아니면 거부.

## 컨트롤러 추가

[SubscriptionController.java](backend/src/main/java/com/arrivallab/pawprint/domain/subscription/controller/SubscriptionController.java) 에 메서드 추가:

```java
@PostMapping("/redeem-offer-code")
public ResponseEntity<ApiResponse<SubscriptionStatusResponse>> redeemOfferCode(
        @AuthenticationPrincipal UserDetails userDetails,
        @Valid @RequestBody BetaRedeemRequest request) {
    Long userId = Long.parseLong(userDetails.getUsername());
    return ApiResponse.ok(subscriptionService.redeemBetaCode(userId, request));
}
```

## DTO

```java
public record BetaRedeemRequest(
        @NotBlank String receipt,                  // base64 영수증
        String transactionId,                      // Apple 측 transaction id (옵션)
        String offerCodeIdentifier                 // 옵션 — 로깅·통계용
) {}
```

응답은 기존 `SubscriptionStatusResponse` 재사용 — 클라이언트는 `/status` 와 동일한 형식 받음 (필드 확장은 04 문서 참고).

## ErrorCode 추가

[ErrorCode] 에 베타 전용 추가:
- `BETA_PROMO_ALREADY_REDEEMED(409, "이미 베타 코드를 사용하셨어요.")`
- (검증 실패는 기존 `PURCHASE_VERIFICATION_FAILED` 재사용)

## 엔드포인트 명세

### Request
```
POST /api/subscriptions/redeem-offer-code
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "receipt": "{base64-encoded-receipt}",
  "transactionId": "1000000123456789",
  "offerCodeIdentifier": "BETA_TESTER_001"
}
```

### Response — 성공
ApiResponse 래퍼는 발자국 표준:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "subscriptionType": "BETA",
    "expiresAt": "2026-11-22T12:00:00",
    "isActive": true
  }
}
```

### Response — 실패
```json
{
  "success": false,
  "message": "이미 베타 코드를 사용하셨어요.",
  "data": null
}
```
- `BETA_PROMO_ALREADY_REDEEMED` → 409
- `PURCHASE_VERIFICATION_FAILED` → 400 (기존)
- `USER_NOT_FOUND` → 404

## 베타 → 정식 전환

별도 처리 없음. 베타 사용자가 정식 구독 결제 시 클라이언트가 `POST /api/subscriptions/purchase` 호출 → 기존 `SubscriptionService.purchase()` 흐름 → `User.updateSubscription(FRIEND|FAMILY|PREMIUM, expiresAt)` 가 자동으로 `subscription_type` 을 BETA → 유료 tier 로 덮어씀.

> `beta_promo_used` 는 true 유지 → 중복 redeem 차단 계속 유효.

## 환경변수

`application-prod.yml` 에 추가, ECS task definition 에서 주입:
```yaml
beta:
  promo:
    premium-months: ${BETA_PROMO_PREMIUM_MONTHS:6}
```

## 작업 완료 기준

- [ ] `SubscriptionService.redeemBetaCode()` 추가
- [ ] `SubscriptionController` 에 `/redeem-offer-code` 추가
- [ ] `BetaRedeemRequest` DTO
- [ ] `User.activateBeta()` 도메인 메서드 (01 문서)
- [ ] `ErrorCode.BETA_PROMO_ALREADY_REDEEMED` 추가
- [ ] 중복 redeem 거부 (`beta_promo_used = true` 체크)
- [ ] 중복 transaction_id 거부 (`SubscriptionRepository.existsByTransactionId`)
- [ ] 단위 테스트 (mock 영수증 검증)

## 절대 변경 금지

- ❌ `verifyIos()` / `verifyAndroid()` / `callAppleVerify()` 내부 로직
- ❌ `purchase()` / `restore()` / `activateSubscription()` 흐름
- ❌ `subscriptions` 테이블 (베타는 레코드 안 만듦)
