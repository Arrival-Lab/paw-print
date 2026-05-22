# 07. 클라이언트 (React Native) 작업

> **중요**: 본 작업은 백엔드 우선. 클라이언트는 백엔드 API 완료 후 **별도 세션**에서 진행 권장.

## 작업 범위 (개요)

### 1. 멤버십 화면 — [frontend/app/subscription.tsx](frontend/app/subscription.tsx)

- 만료일 D-day 뱃지 (`subscriptionStatusResponse.daysUntilExpiry` 활용)
- BETA tier 표시 (`subscriptionType === "BETA"` 면 "베타 테스터 프리미엄" 라벨)

### 2. 인앱 배너

- D-14, D-7, D-1 시점 자동 노출
- `expiryBannerType` 값에 따라 스타일 분기
  - `"D14"`: info (옅은 회색)
  - `"D7"`:  warning (노랑/주황 — `Colors.secondary.dark` 등)
  - `"D1"`:  critical (`Colors.status.error`)
- 닫기 가능 (X 버튼)
- 닫은 이력은 MMKV (`features/auth/store/authStore.ts` 패턴 참고 — 본 프로젝트는 AsyncStorage 가 아니라 MMKV)
- 컬러는 [frontend/constants/colors.ts](frontend/constants/colors.ts) 만 사용 — hex 직접 입력 금지

### 3. D-1 모달

앱 진입 시 1회 자동 표시. `showExpiryModal === true` 일 때 노출.

```
┌─────────────────────────────────┐
│    🐾 프리미엄이 내일 종료돼요    │
│                                  │
│   베타 테스트 참여로 받은         │
│   6개월 프리미엄이 종료됩니다.    │
│   계속 이용하시겠어요?            │
│                                  │
│  ┌───────────────────────────┐  │
│  │  ✨ 프리미엄 계속하기       │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  무료 플랜으로 전환         │  │
│  │  기록은 그대로 유지돼요     │  │
│  └───────────────────────────┘  │
│                                  │
│  [나중에 결정하기]                │
└─────────────────────────────────┘
```

- "프리미엄 계속하기" → 정상가 결제 화면 (기존 멤버십 화면으로 이동)
- "무료 플랜으로 전환" → 확인 다이얼로그 → (현재 즉시 강등 API 는 없음 — 만료일 도래 시 서버 배치가 자동 강등) → 토스트 + 모달 닫기
- "나중에 결정하기" → 모달 닫기 (만료일에 배치가 자동 무료 전환)
- 닫기 후 MMKV 에 `d1_modal_shown_for_<expiryDate>=true` 저장 (재표시 방지). 다음 베타 사이클이면 다른 키.

> 04 문서 결정: D-1 모달 재표시 방지는 **클라이언트 (MMKV)** 가 관리. 서버는 D-1 윈도우 동안 항상 `showExpiryModal: true`.

### 4. 강등 결과 모달

만료 후 첫 진입 시 자동 표시. `showDowngradeModal === true` 일 때.

```
┌─────────────────────────────────┐
│   무료 플랜으로 전환됐어요        │
│                                  │
│   프리미엄 기능이 제한되지만,     │
│   기록은 그대로 유지돼요.         │
│                                  │
│   언제든 프리미엄을 다시 시작할   │
│   수 있어요.                      │
│                                  │
│  ┌───────────────────────────┐  │
│  │  프리미엄 구독하기          │  │
│  └───────────────────────────┘  │
│                                  │
│  [확인]                           │
└─────────────────────────────────┘
```

확인 누르면 `POST /api/subscriptions/downgrade-modal/ack` 호출 → 서버가 `show_downgrade_modal = false` (05 문서).

### 5. 결제 화면

- 베타·일반 사용자 모두 동일한 정상가 결제 흐름 — 기존 `frontend/app/subscription.tsx` 그대로 사용
- 할인 분기 X (정책 제거됨, 06 문서 deprecated 참고)

## API 클라이언트

[frontend/features/subscription/api/subscriptionApi.ts](frontend/features/subscription/api/subscriptionApi.ts) 에 추가:
- `redeemBetaCode(receipt: string, transactionId?: string, offerCodeIdentifier?: string)`
- `ackDowngradeModal()`
- 기존 `getStatus()` 응답 타입 확장 (필드 4개 추가 — 04 문서)

## Push 알림 category 등록

03 문서 — 백엔드가 `categoryId: "PREMIUM_EXPIRY"` 로 발송.

클라이언트 부팅 시 `expo-notifications` 의 `setNotificationCategoryAsync("PREMIUM_EXPIRY", [...])` 등록 (action button 필요하면 정의, 단순 알림이면 빈 actions 도 가능). 위치: [frontend/app/_layout.tsx](frontend/app/_layout.tsx) 또는 push 초기화 훅.

## SubscriptionType 클라이언트 타입 확장

`subscriptionType` 응답이 `"BETA"` 를 새로 받음. 프론트 enum/union 타입에 추가:
```ts
type SubscriptionType = "FREE" | "FRIEND" | "FAMILY" | "PREMIUM" | "BETA";
```
[features/subscription/](frontend/features/subscription/) 의 타입 파일에 반영.

기존 게이팅 (`type === "FREE"` 만 차단) 은 BETA 가 자동 unlocked → 별도 분기 불필요. 단, BETA 만의 UI 표시 (만료일 카운트다운, 베타 라벨) 가 있는 화면은 명시적 분기 필요.

## 디자인 가이드

- 기존 발자국 디자인 시스템 따름 (CLAUDE.md 의 컬러 토큰)
- 새 컴포넌트 만들지 말고 기존 `PremiumModal` / 배너 컴포넌트 재사용 ([frontend/shared/components/PremiumModal.tsx](frontend/shared/components/PremiumModal.tsx))
- StyleSheet 금지 — NativeWind className + 토큰 spread
- hex 직접 사용 금지 — `Colors.*`

## 절대 변경 금지

- 기존 멤버십 화면 레이아웃 (필드 추가만)
- 기존 결제 플로우 흐름
- 기존 `PremiumModal` props 구조

## 작업 완료 기준

- [ ] `subscriptionApi.ts` 함수 3종 추가/확장 (`redeemBetaCode`, `ackDowngradeModal`, `getStatus` 응답 확장)
- [ ] `SubscriptionStatus` 타입에 베타 필드 4개
- [ ] `SubscriptionType` 에 `BETA` 추가
- [ ] 인앱 배너 컴포넌트 (D-14/D-7/D-1)
- [ ] D-1 모달 컴포넌트
- [ ] 강등 결과 모달 컴포넌트 + ack API 연동
- [ ] MMKV 모달 표시 이력 관리
- [ ] Expo Push `PREMIUM_EXPIRY` category 등록
