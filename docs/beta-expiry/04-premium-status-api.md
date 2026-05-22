# 04. Premium Status API

## 작업 범위

클라이언트가 앱 진입 시 호출하는 엔드포인트. 인앱 배너/모달 표시 여부 판단.

## 엔드포인트

```
GET /api/user/premium-status
Authorization: Bearer {user_token}
```

## Response

```json
{
  "is_premium": true,
  "premium_source": "beta_promo",
  "premium_expires_at": "2026-11-22T00:00:00Z",
  "days_until_expiry": 14,
  "expiry_banner_type": "d14",
  "show_expiry_modal": false,
  "beta_discount_available": true,
  "beta_discount_expires_at": "2026-12-22T00:00:00Z"
}
```

## 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| `is_premium` | boolean | 프리미엄 상태 |
| `premium_source` | string \| null | `"beta_promo"`, `"paid"`, `null` |
| `premium_expires_at` | timestamp \| null | 만료일 |
| `days_until_expiry` | integer \| null | 남은 일수 |
| `expiry_banner_type` | enum \| null | `"d14"`, `"d7"`, `"d1"`, `null` |
| `show_expiry_modal` | boolean | D-1 시점 모달 표시 여부 |
| `beta_discount_available` | boolean | 베타 할인 쿠폰 사용 가능 여부 |
| `beta_discount_expires_at` | timestamp \| null | 할인 쿠폰 만료일 |

## expiry_banner_type 로직

```
days_until_expiry <= 1  → "d1"     (critical)
days_until_expiry <= 7  → "d7"     (warning)
days_until_expiry <= 14 → "d14"    (info)
그 외                   → null
```

## show_expiry_modal 로직

- D-1 시점 (days_until_expiry == 1) AND 사용자가 아직 모달을 보지 않았을 때 true
- 클라이언트가 한 번 닫으면 로컬에 표시 이력 저장 (다음 호출 시 false 반환은 클라이언트 책임)
- 또는 서버에서 `last_d1_modal_shown_at` 필드로 관리해도 됨 (선택)

## 기존 API와의 통합

- 이미 사용자 상태 조회 API가 있으면 거기에 필드 추가하는 게 자연스러움
- 별도 엔드포인트가 깔끔하면 신설

## 확인 필요 사항

- 기존 사용자 상태 조회 API 존재 여부와 위치

## 작업 완료 기준

- [ ] 엔드포인트 구현 (또는 기존 API에 필드 추가)
- [ ] 응답 DTO 정의
- [ ] 단위 테스트 (각 시점별 응답 검증)
