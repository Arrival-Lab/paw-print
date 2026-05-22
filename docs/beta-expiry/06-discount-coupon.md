# 06. 베타 할인 쿠폰 로직 — **deprecated (2026-05-22 정책 변경)**

> **본 문서의 기능은 사용하지 않음.** 베타 만료 후 30일 한정 할인 정책이 전면 제거됨.
>
> 만료 흐름은 단순화됨:
> - 베타 6개월 무료 → 만료 알림 (D-14 / D-7 / D-1) → 만료 시
>   - 사용자가 "프리미엄 계속하기" 선택 → **정상가** 결제 (02·07 문서)
>   - 사용자가 "무료 플랜으로 전환" 또는 미선택 → 자동 FREE 강등 (05 문서)
>
> 제거된 항목:
> - `beta_discount_eligible_until` 컬럼 → 01 문서에서 제외됨
> - D+27 할인 만료 알림 → 03 문서에서 제외됨
> - `betaDiscountAvailable` / `betaDiscountEligibleUntil` 응답 필드 → 04 문서에서 제외됨
> - `GET /api/subscriptions/pricing` 엔드포인트 → 신설 안 함
> - `BetaPromoProperties.discountDurationDays` / `discountPercent` → 02 문서에서 제외됨
> - Apple Introductory Offer 활용 → 정상가 결제만
>
> 본 파일은 정책 변경 이력 추적용으로만 보존. 향후 재도입 시 별도 문서로 분리할 것.
