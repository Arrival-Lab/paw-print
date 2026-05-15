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
│   ├── colors.ts             # 모든 컬러 상수 (light + dark + status)
│   ├── typography.ts         # 폰트 크기/두께/letterSpacing/preset
│   ├── spacing.ts            # 여백/패딩/반경/elevation
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
    ├── components/           # 앱 전체 공통 컴포넌트 (디자인 시스템 primitives)
    │   ├── Button.tsx         # 6 variants × 3 sizes, icon 지원, loading, elevated
    │   ├── Card.tsx           # flat/outlined/elevated/tinted × 4 padding
    │   ├── Badge.tsx          # 7 tones × 2 sizes (상태/구독/카테고리 라벨)
    │   ├── Chip.tsx           # 선택 가능한 알약형 (필터/탭/카테고리)
    │   ├── Divider.tsx        # horizontal/vertical
    │   ├── ScreenHeader.tsx   # 페이지 상단 헤더 (back/title/actions × default/large)
    │   ├── SectionHeader.tsx  # 섹션 제목 + caption + action
    │   ├── Fab.tsx            # Floating Action Button (primary/secondary tone)
    │   ├── EmptyState.tsx     # 아이콘 배경 원형 + title + desc + 1·2차 action
    │   ├── PremiumModal.tsx   # 바텀시트 + 6 benefits + 월/연 토글
    │   └── LoadingSpinner.tsx # 전체화면 / inline + label
    ├── hooks/
    │   └── useTheme.ts        # useTheme()/useColors() — 라이트/다크 동적 컬러
    ├── store/
    │   ├── uiStore.ts         # isPremiumModalVisible 등 전역 UI 상태
    │   └── themeStore.ts      # mode: system|light|dark (MMKV persist)
    └── utils/
        ├── storage.ts         # MMKV 래퍼 (토큰 관리)
        └── format.ts          # 날짜/숫자 포맷

## constants/colors.ts — 전체 컬러 상수
export const Colors = {
  // 브랜드 컬러 — 슬레이트블루/스카이블루. 이 파일만 수정하면 전체 앱 반영.
  primary: '#5B7FA6',         // 슬레이트블루 — 메인 CTA, 탭 활성, 헤더, 링크 (흰 텍스트 대비 5.1:1 AA)
  primaryDark: '#44638A',     // primary pressed/강조 텍스트 (대비 7.4:1)
  primaryLight: '#E8EEF5',    // 선택 배경, 칩, hover
  secondary: '#7EC8E3',       // 스카이블루 — FAB, 보조 액션, 차트 액센트 (배경 전용, 흰 글자 금지)
  secondaryDark: '#4FA8C9',   // secondary pressed/아이콘 위 흰 글자 가능 (대비 3.2:1, UI 컴포넌트만)
  secondaryLight: '#E5F4FB',  // 알림 배경, 인포 배너
  // 기본
  white: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#F7F9FC',         // 카드 외부 배경 (살짝 블루틴트)
  border: '#E5EAF0',          // 1px 디바이더
  // 텍스트 (살짝 블루틴트)
  text: {
    primary: '#1A2433',       // 본문 (대비 14.8:1)
    secondary: '#5C6577',     // 보조 텍스트 (대비 6.7:1)
    tertiary: '#8E96A8',      // 캡션, 비활성 탭 (대비 3.5:1)
    disabled: '#C5CAD3',
    inverse: '#FFFFFF',
  },
  // 상태 (브랜드 블루와 변별 가능한 채도/명도 재조정)
  status: {
    success: '#2E9F6B',       // 정상 수치, 완료
    warning: '#E89B2A',       // 임박 백신, 주의
    error: '#D64545',         // 경고, 삭제
    info: '#5B7FA6',          // primary와 동일 — 정보 전달 통일
  },
  premium: '#F5D87A',         // 프리미엄 배지 배경
  premiumText: '#7A5C00',     // 프리미엄 배지 텍스트
  shadow: '#000000',          // elevation shadow color
  overlay: 'rgba(26,36,51,0.5)',  // 블루틴트 오버레이
} as const;

### 컬러 사용 규칙
- 본문/긴 텍스트 위 배경: primary 또는 primaryDark만 사용 (secondary 위 흰 텍스트 금지 — 대비 1.9:1)
- FAB·아이콘 버튼처럼 큰 UI 컴포넌트(WCAG 3:1 기준)는 secondary 배경 + 흰 아이콘 허용
- 상태 색만으로 의미 전달 금지 — 항상 아이콘/라벨 병행
- info = primary로 통일. 별도 info 컬러를 추가하지 말 것
- 다크 모드 토큰: `Colors.dark.*` (background/surface/text/border 별도 정의). 라이트 토큰을 직접 invert 하지 말 것.
- 상태 배경: 상태 배지나 배너에는 `status.successBg`/`status.warningBg`/`status.errorBg`/`status.infoBg` 사용 (텍스트 컬러는 같은 짝의 진한 버전).

## constants/typography.ts
export const Typography = {
  size: { xs:11, sm:13, md:15, lg:17, xl:20, xxl:24, xxxl:28, display:34 },
  weight: { regular:'400', medium:'500', semibold:'600', bold:'700' },
  lineHeight: { tight:1.4, normal:1.55, relaxed:1.75 },   // 한국어 가독성 위해 상향
  letterSpacing: { tight:-0.4, normal:-0.2, wide:0.2 },   // 한글에 살짝 음수 트래킹
  preset: {                                                // 시맨틱 프리셋 — 화면에선 이걸 사용
    display:    { fontSize:34, fontWeight:'700', lineHeight:42, letterSpacing:-0.4 },
    h1:         { fontSize:28, fontWeight:'700', lineHeight:36, letterSpacing:-0.4 },
    h2:         { fontSize:24, fontWeight:'700', lineHeight:32, letterSpacing:-0.2 },
    h3:         { fontSize:20, fontWeight:'600', lineHeight:28, letterSpacing:-0.2 },
    title:      { fontSize:17, fontWeight:'600', lineHeight:24, letterSpacing:-0.2 },
    body:       { fontSize:15, fontWeight:'400', lineHeight:23, letterSpacing:-0.2 },
    bodyMedium: { fontSize:15, fontWeight:'500', lineHeight:23, letterSpacing:-0.2 },
    bodySmall:  { fontSize:13, fontWeight:'400', lineHeight:20, letterSpacing:-0.2 },
    caption:    { fontSize:11, fontWeight:'500', lineHeight:15, letterSpacing:0.2 },
    label:      { fontSize:13, fontWeight:'600', lineHeight:18, letterSpacing:0.2 },
    button:     { fontSize:15, fontWeight:'600', lineHeight:20, letterSpacing:-0.2 },
  },
} as const;

### Typography 사용 규칙
- 화면 코드에서 직접 fontSize/fontWeight 조합 금지. `Typography.preset.body` 같은 프리셋 spread 권장.
- 새 위계가 필요하면 preset에 먼저 추가하고 화면에선 그 이름으로 참조.
- 한글 본문 줄간격은 1.55. 1.3 이하 사용 시 한글 받침이 잘려 보일 수 있음.

## constants/spacing.ts
export const Spacing = {
  xs:4, sm:8, md:12, lg:16, xl:20, xxl:24, xxxl:32, xxxxl:40,
  borderRadius: { sm:8, md:12, lg:16, xl:20, xxl:28, full:9999 },
  hitSlop: { top:8, bottom:8, left:8, right:8 },   // 작은 탭 영역 보강
  touchTarget: 44,                                  // 최소 터치 타깃
  fab: { size:56, bottom:24, right:16 },           // FAB 표준 위치
} as const;

export const Elevation = {
  none, card, raised, floating, modal   // 카드/FAB/모달 그림자 5단계 (iOS shadow + Android elevation)
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

## tailwind.config.js — 토큰 동기화
theme.extend에 colors / borderRadius / fontSize 모두 연동.
- colors: primary, primaryDark, primaryLight, primaryMuted, secondary, secondaryDark,
  secondaryLight, surface, border, borderStrong, premium, success, warning, error, ink.{100..900}
- borderRadius: sm/md/lg/xl/xxl
- fontSize: xs/sm/md/lg/xl/xxl/xxxl/display

className='bg-primary text-white rounded-lg' 사용 가능. NativeWind className에 hex 코드 직접 입력 금지.
bg-black은 Apple HIG 필수 스타일(Apple 로그인 버튼)에 한해 허용.

## 디자인 시스템 — 컴포넌트 선택 가이드
| 상황 | 컴포넌트 |
|---|---|
| 화면 상단 헤더 (뒤로/제목/액션) | `<ScreenHeader title="..." back actions={[...]} />` |
| 큰 페이지 타이틀 + subtitle | `<ScreenHeader variant="large" title subtitle />` |
| 섹션 구분 + 더보기 | `<SectionHeader title caption action={{label,onPress}} />` |
| 메인 액션 버튼 | `<Button variant="primary" />` |
| 보조 액션 (블루 배경) | `<Button variant="secondary" />` (텍스트는 primaryDark) |
| 옅은 강조 액션 | `<Button variant="tonal" />` (primaryLight 배경) |
| 텍스트만 액션 | `<Button variant="ghost" />` |
| 외곽선 액션 | `<Button variant="outline" />` |
| 위험 액션 (삭제 등) | `<Button variant="danger" />` |
| 우하단 추가 액션 | `<Fab onPress icon="plus" />` |
| 필터 칩 / 카테고리 토글 | `<Chip label selected onPress />` |
| 상태 표시 라벨 | `<Badge tone="success\|warning\|...">텍스트</Badge>` |
| 정보 그룹 박스 | `<Card variant="elevated\|outlined\|tinted\|flat" padding="sm\|md\|lg" />` |
| 데이터 없음 화면 | `<EmptyState icon title description action />` |
| 로딩 | `<LoadingSpinner label />` 또는 `inline` |
| 1px 구분선 | `<Divider />` (orientation, tone) |

## 디자인 시스템 — 핵심 원칙
1. **토큰 우선**: 화면에서 직접 색/크기 하드코딩 금지. 항상 Colors/Typography/Spacing/Elevation 참조.
2. **시맨틱 프리셋**: `style={{ ...Typography.preset.body }}` 처럼 spread해서 사용. fontSize/fontWeight 직접 조합 금지.
3. **그림자는 Elevation에서만**: shadowOffset/Opacity 직접 작성 금지. `...Elevation.card` 처럼 spread.
4. **터치 타깃 ≥ 44pt**: 작은 아이콘 버튼은 hitSlop={Spacing.hitSlop} 또는 wrapper로 44pt 보장.
5. **WCAG AA**: 본문 4.5:1, UI 3:1. 새 색 조합 도입 전에 contrast checker로 검증.
6. **공통 패턴 우선**: 인라인으로 헤더/FAB/Chip을 새로 만들지 말 것. shared/components 가서 추가하거나 props 확장.

## Dev 로그인 (로컬 전용)
로그인 화면에서 __DEV__ === true일 때만 🛠 Dev Login 버튼 노출.
features/auth/api/authApi.ts → devLogin() → POST /api/auth/dev-login (백엔드 local 프로파일).
Google OAuth 미설정 상태에서도 PREMIUM 계정으로 전체 기능 테스트 가능.

## 다크 모드
앱은 라이트/다크 두 테마를 모두 지원하며, 사용자는 마이페이지에서 시스템/라이트/다크 중 선택할 수 있다.

### 인프라
- `shared/store/themeStore.ts` — Zustand store, mode 'system'|'light'|'dark', MMKV에 영구 저장.
- `shared/hooks/useTheme.ts` — `useTheme()` / `useColors()` hook.
  - `useTheme()` → `{ mode, scheme, isDark, colors, setMode }`
  - `useColors()` → 현재 테마의 컬러 객체만 반환 (light/dark 토큰 자동 선택)
- `app/_layout.tsx` — StatusBar 색 + Stack content 배경을 useTheme()으로 동기화.

### 동적 컬러 사용법
화면을 다크 모드에 대응시키려면 `Colors`(static const) → `useColors()`(reactive hook)로 마이그레이션:
```ts
// 변경 전
import { Colors } from '../../constants';
function Screen() {
  return <Text style={{ color: Colors.text.primary }}>...</Text>;
}

// 변경 후
import { useColors } from '../../shared/hooks/useTheme';
function Screen() {
  const Colors = useColors();   // 변수명 유지 → 본문 수정 최소화
  return <Text style={{ color: Colors.text.primary }}>...</Text>;
}
```

### 마이그레이션 현황
- ✅ 인프라(themeStore, useTheme, _layout StatusBar) 완료.
- ✅ 마이페이지에 테마 토글 UI (시스템/라이트/다크 세그먼트) 완료.
- ⚠️ shared/components 11개 + 화면 19개는 아직 static `Colors` 참조 중. 점진적으로 `useColors()`로 전환 필요.
- 마이그레이션 우선순위: ScreenHeader → Card → Button → Fab → Chip → Badge → PremiumModal → tabs/_layout → 각 화면 SafeAreaView 배경.

### 화면 외부 helper에서 hook 호출 금지
`SectionLabel`, `Field` 같이 컴포넌트 함수 본문 안의 helper에선 hook을 호출할 수 있지만, **파일 상단의 일반 함수** 안에서 호출하면 Rules of Hooks 위반. 그런 경우 props로 colors를 받아 넘기거나 helper를 컴포넌트화할 것.

## shared/api/client.ts 규칙
요청 인터셉터: MMKV accessToken → Authorization: Bearer {token} 헤더.
응답 인터셉터:
  401 → refreshToken으로 POST /api/auth/refresh 시도.
       성공: 새 토큰 저장 + 원래 요청 재시도.
       실패: clearAuth() + router.replace('/(auth)/login').
  402 → uiStore.showPremiumModal(error.response.data.message) 호출.
  응답 data는 ApiResponse<T>.data 필드만 언래핑해서 반환.
