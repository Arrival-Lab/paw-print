# 06. 베타 할인 쿠폰 로직

## 작업 범위

베타 테스터에게 만료 후 30일간 첫 달 할인 제공.

## 쿠폰 발급 방식

별도 쿠폰 코드 발급 X. 사용자 속성으로 관리.

```
beta_promo_used = true 인 사용자는 자동으로
beta_discount_eligible_until 기간 동안 할인 쿠폰 보유
```

## 적용 조건

사용자가 D-7 ~ D+30 사이 정기 구독 결제 시:

- 현재 시각이 `beta_discount_eligible_until` 이전이면 할인가로 결제
- 첫 달만 할인, 두 번째 달부터 정상가

## Apple Introductory Offer 활용

Apple Introductory Offer는 App Store Connect에서 설정.
- 종류: "Pay As You Go" 또는 "Pay Up Front" 또는 "Free Trial"
- 베타 테스터용은 "할인된 가격으로 첫 1개월" 형태
- 클라이언트는 어느 가격대로 결제 화면 띄울지만 결정

## 환경 변수

```
BETA_DISCOUNT_PERCENT=50
BETA_DISCOUNT_DURATION_DAYS=30
BETA_PROMO_PREMIUM_MONTHS=6
```

추후 정책 변경 시 코드 수정 없이 환경 변수로 조정.

## API 추가

### 결제 화면 진입 시 가격 조회

```
GET /api/subscription/pricing
Authorization: Bearer {user_token}
```

Response:

```json
{
  "regular_price": {
    "monthly": 3900,
    "yearly": 39000
  },
  "discount_applicable": true,
  "discount_price": {
    "monthly": 1950,
    "first_month_only": true
  },
  "discount_expires_at": "2026-12-22T00:00:00Z"
}
```

## 작업 완료 기준

- [ ] 환경 변수 설정
- [ ] 가격 조회 API 구현
- [ ] 할인 적용 가능 여부 판단 로직
- [ ] Apple Introductory Offer 연동 (App Store Connect 설정은 사용자가 직접)
- [ ] 단위 테스트
