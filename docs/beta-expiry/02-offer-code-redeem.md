# 02. Apple Offer Code Redeem 처리

## 작업 범위

iOS 클라이언트가 Offer Code 사용 후 영수증을 서버로 보내면 검증하고 6개월 프리미엄 활성화.

## 흐름

1. iOS 클라이언트: 사용자가 Offer Code 입력 → StoreKit으로 redeem → 영수증 획득
2. iOS 클라이언트 → 서버 (`POST /api/subscription/redeem-offer-code`)
3. 서버: Apple App Store Server API로 영수증 검증
4. 검증 성공 시 DB 업데이트
5. 사용자 플랜 프리미엄으로 전환

## 서버 처리 로직

검증 성공 시 다음 필드 업데이트:

```
beta_promo_used = true
beta_promo_redeemed_at = now()
premium_expires_at = now() + 6 months
beta_discount_eligible_until = premium_expires_at + 30 days
is_premium = true
premium_source = 'beta_promo'
```

## 기존 코드와의 통합

- 기존 IAP 영수증 검증 로직이 이미 있을 것
- **Offer Code 케이스만 분기 추가**하는 방식으로 작업
- 기존 검증 로직 자체는 절대 리팩토링 X

## 확인 필요 사항

- 현재 IAP 영수증 검증 로직 위치와 흐름 파악
- Apple App Store Server API 키 설정 위치 (이미 셋업되어 있을 것)
- 검증 실패 시 처리 방식 (기존 로직 따름)

## API 명세

### Request

```
POST /api/subscription/redeem-offer-code
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "receipt": "{base64-encoded-receipt}",
  "transaction_id": "{apple-transaction-id}",
  "offer_code_identifier": "{optional}"
}
```

### Response (성공)

```
200 OK

{
  "success": true,
  "premium_expires_at": "2026-11-22T00:00:00Z",
  "beta_discount_eligible_until": "2026-12-22T00:00:00Z"
}
```

### Response (실패)

```
400 Bad Request

{
  "success": false,
  "error_code": "INVALID_RECEIPT" | "ALREADY_REDEEMED" | "INELIGIBLE_USER",
  "message": "..."
}
```

## 작업 완료 기준

- [ ] 기존 IAP 검증 로직 파악 및 위치 보고
- [ ] Offer Code 분기 추가
- [ ] DB 업데이트 로직 구현
- [ ] 중복 redeem 방지 로직 (이미 `beta_promo_used = true`인 경우 거부)
- [ ] 단위 테스트 작성
