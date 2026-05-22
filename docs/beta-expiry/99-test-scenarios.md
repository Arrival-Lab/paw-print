# 99. 테스트 시나리오

구현 완료 후 다음 시나리오가 모두 동작해야 함.

## 1. Offer Code Redeem

- [ ] 베타 코드 사용 → 6개월 프리미엄 활성화
- [ ] `premium_expires_at` = redeemed_at + 6 months 정확히 계산
- [ ] `beta_discount_eligible_until` = premium_expires_at + 30 days
- [ ] 중복 redeem 시 거부

## 2. 알림 발송

- [ ] D-14 시점 → 인앱 배너만 표시 (푸시 X)
- [ ] D-7 시점 → 푸시 1회 + 인앱 배너
- [ ] D-1 시점 → 푸시 1회 + 인앱 모달
- [ ] D+27 시점 → 푸시 1회 (할인 만료 임박)
- [ ] 동일 시점 중복 발송 안 됨
- [ ] 푸시 권한 거부 사용자에게 푸시 발송 안 됨

## 3. 사용자 선택 시나리오

### 시나리오 A: D-1 모달에서 "프리미엄 계속하기" 선택
- [ ] 할인 적용된 결제 화면 진입
- [ ] 첫 달만 할인가, 두 번째 달부터 정상가
- [ ] 결제 성공 시 `premium_source` = "paid"로 변경

### 시나리오 B: D-1 모달에서 "무료 플랜으로 전환" 선택
- [ ] 즉시 무료 전환
- [ ] 토스트 노출
- [ ] D-Day 모달 스킵

### 시나리오 C: 사용자가 아무것도 선택 안 함 (디폴트)
- [ ] 만료일에 자동 무료 전환
- [ ] 다음 진입 시 결과 모달 자동 표시
- [ ] 모달 닫은 후 재표시 안 됨

## 4. 할인 쿠폰

- [ ] 무료 전환 후 30일간 할인 쿠폰 유효
- [ ] D+30 이후 결제 시 정상가 적용
- [ ] D+27 시점 할인 만료 임박 푸시 1회

## 5. 상태 API

- [ ] D-14 호출 → `expiry_banner_type: "d14"`, `show_expiry_modal: false`
- [ ] D-7 호출 → `expiry_banner_type: "d7"`
- [ ] D-1 호출 → `expiry_banner_type: "d1"`, `show_expiry_modal: true`
- [ ] D+1 호출 → `is_premium: false`, `beta_discount_available: true`
- [ ] D+31 호출 → `beta_discount_available: false`

## 6. 엣지 케이스

- [ ] 베타 코드 사용 후 즉시 정식 구독 결제 시 → 어떻게 처리할지 결정 필요
- [ ] 사용자가 베타 기간 중 앱 삭제 → 재설치 시 상태 복원
- [ ] 시간대 처리: 모든 시점은 KST 기준
- [ ] 푸시 발송 실패 → 재시도 로직 (또는 무시)

## Mock 시간 테스트

D-14, D-7 같은 시간 기반 테스트는 mock 시간으로 단위 테스트 작성.
- Spring: `@MockBean Clock clock`
- 또는 `LocalDateTime.now()` 대신 `clock.now()` 사용

실시간 통합 테스트는 수동으로 진행.
