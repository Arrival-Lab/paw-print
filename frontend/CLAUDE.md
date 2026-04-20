# Frontend — React Native (Expo)

## 디렉토리 구조
frontend/
├── app/                      # expo-router 라우팅만. 비즈니스 로직 없음.
│   ├── _layout.tsx           # QueryClient, SafeArea, PremiumModal, 인증 라우팅
│   ├── (auth)/
│   │   └── login.tsx
│   └── (tabs)/
│       ├── _layout.tsx       # 하단 탭 네비게이터
│       ├── index.tsx         # 캘린더 (건강 다이어리)
│       ├── records.tsx       # 진료기록
│       ├── community.tsx     # 커뮤니티
│       └── mypage.tsx        # 마이페이지
├── constants/                # ★ 변경 최소화 핵심. 여기만 수정하면 전체 반영.
│   ├── colors.ts             # 모든 컬러 상수
│   ├── typography.ts         # 폰트 크기/두께
│   ├── spacing.ts            # 여백/패딩/반경
│   ├── config.ts             # 환경변수, 앱 설정값, 가격
│   └── index.ts              # 통합 re-export
├── features/                 # 기능별 모듈
│   ├── auth/
│   │   ├── api/authApi.ts
│   │   ├── hooks/useAuth.ts
│   │   ├── store/authStore.ts
│   │   └── types/
│   ├── pet/
│   ├── record/
│   ├── diary/
│   ├── vaccine/
│   ├── food/
│   ├── hospital/
│   ├── share/
│   ├── community/
│   └── subscription/
└── shared/
    ├── api/
    │   ├── client.ts         # axios 인스턴스 (JWT 인터셉터, 402 처리)
    │   └── types.ts          # ApiResponse<T>, PageResponse<T>
    ├── components/           # 앱 전체 공통 컴포넌트
    │   ├── Button.tsx
    │   ├── Card.tsx
    │   ├── PremiumModal.tsx
    │   ├── EmptyState.tsx
    │   └── LoadingSpinner.tsx
    ├── store/
    │   └── uiStore.ts        # isPremiumModalVisible 등 전역 UI 상태
    └── utils/
        ├── storage.ts        # MMKV 래퍼 (토큰 관리)
        └── format.ts         # 날짜/숫자 포맷

## constants/colors.ts — 전체 컬러 상수
export const Colors = {
  // 브랜드 컬러 (임시, 이 파일만 수정하면 전체 앱 반영)
  primary: '#5B7FA6',         // 스모키블루 — 메인 액션, 탭바, 헤더
  secondary: '#7EC8E3',       // 베이비블루 — 서브 액션, 배지, FAB
  primaryLight: '#EEF3F8',    // primary 연한 배경
  secondaryLight: '#EEF9FD',  // secondary 연한 배경
  // 기본
  white: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  border: '#F0F0F0',
  // 텍스트
  text: {
    primary: '#1A1A1A',
    secondary: '#666666',
    tertiary: '#999999',
    disabled: '#CCCCCC',
    inverse: '#FFFFFF',
  },
  // 상태
  status: {
    success: '#2EAE75',
    warning: '#F5A623',
    error: '#E53E3E',
    info: '#5B7FA6',
  },
  premium: '#F5D87A',         // 프리미엄 강조색
  overlay: 'rgba(0,0,0,0.5)',
} as const;

## constants/typography.ts
export const Typography = {
  size: { xs:11, sm:13, md:15, lg:17, xl:20, xxl:24, xxxl:28, display:34 },
  weight: { regular:'400', medium:'500', semibold:'600', bold:'700' },
  lineHeight: { tight:1.3, normal:1.5, relaxed:1.7 },
} as const;

## constants/spacing.ts
export const Spacing = {
  xs:4, sm:8, md:12, lg:16, xl:20, xxl:24, xxxl:32, xxxxl:40,
  borderRadius: { sm:8, md:12, lg:16, xl:20, full:9999 },
} as const;

## constants/config.ts
export const Config = {
  // 환경변수 (변경 시 .env만 수정)
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080',
  // 앱 설정 (변경 시 이 파일만 수정)
  premiumPriceMonthly: 3900,    // 월 구독 가격(원) — 변경 시 이 줄만
  premiumPriceYearly: 39000,    // 연 구독 가격(원)
  appStoreProductId: 'com.arrivallab.pawprint.premium.monthly',
  playStoreProductId: 'pawprint_premium_monthly',
  freeMaxPets: 3,
  freeMaxPhotosPerRecord: 2,
  freeMaxOcrPerMonth: 3,
  freeMaxVaccineAlerts: 2,
  freeMaxShareMembers: 1,
  freeMetricsMonths: 1,
} as const;

## tailwind.config.js — Colors 상수 연동
theme.extend.colors에 primary, secondary, primaryLight, secondaryLight,
surface, border 연동. className='bg-primary text-white' 사용 가능.

## shared/api/client.ts 규칙
요청 인터셉터: MMKV accessToken → Authorization: Bearer {token} 헤더.
응답 인터셉터:
  401 → refreshToken으로 POST /api/auth/refresh 시도.
       성공: 새 토큰 저장 + 원래 요청 재시도.
       실패: clearAuth() + router.replace('/(auth)/login').
  402 → uiStore.showPremiumModal(error.response.data.message) 호출.
  응답 data는 ApiResponse<T>.data 필드만 언래핑해서 반환.
