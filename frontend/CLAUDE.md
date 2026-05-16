# Frontend — React Native (Expo)

## 디렉토리 구조
```
frontend/
├── app/                         # expo-router 라우팅만. 비즈니스 로직 없음.
│   ├── _layout.tsx              # QueryClient, SafeArea, PremiumModal, 인증 라우팅
│   ├── (auth)/login.tsx
│   └── (tabs)/
│       ├── _layout.tsx          # 하단 탭 네비게이터 (중앙 솟은 홈 버튼)
│       ├── diary.tsx            # 다이어리 캘린더
│       ├── records.tsx          # 건강관리 (진료·예방접종·수치·먹이)
│       ├── index.tsx            # 홈 (펫 카드 + 빠른 액션 + 다가오는 일정)
│       ├── community.tsx        # 커뮤니티
│       └── mypage.tsx           # 마이페이지
├── constants/                   # ★ 변경 최소화 핵심. 여기만 수정하면 전체 반영.
│   ├── colors.ts                # 모든 컬러 상수 (light + dark + status bg)
│   ├── typography.ts            # 폰트 크기/두께/letterSpacing/preset
│   ├── spacing.ts               # 여백/패딩/반경/elevation/hitSlop/fab
│   ├── config.ts                # 환경변수, 앱 설정값, 가격, 무료 한도
│   └── index.ts                 # 통합 re-export
├── features/                    # 기능별 모듈 (api/hooks/components/store/types)
│   ├── auth/  pet/  record/  diary/  vaccine/  food/  metric/
│   ├── hospital/  share/  community/  subscription/
└── shared/
    ├── api/
    │   ├── client.ts            # axios 인스턴스 (JWT 인터셉터, 401 refresh, 402 PremiumModal)
    │   └── types.ts             # ApiResponse<T>, PageResponse<T>
    ├── components/              # 디자인 시스템 primitives (모두 useColors 사용)
    │   ├── Button.tsx           # 6 variants × 3 sizes
    │   ├── Card.tsx             # flat/outlined/elevated/tinted × 4 padding
    │   ├── Badge.tsx  Chip.tsx  Divider.tsx
    │   ├── ScreenHeader.tsx     # back/title/actions, default·large variant
    │   ├── SectionHeader.tsx    # 섹션 제목 + caption + action
    │   ├── Fab.tsx              # FAB (primary/secondary tone)
    │   ├── EmptyState.tsx       # 아이콘 원형 + title + desc + 1·2차 action
    │   ├── PremiumModal.tsx     # 바텀시트 + benefits + 월/연 토글
    │   └── LoadingSpinner.tsx   # 전체화면 / inline + label
    ├── hooks/useTheme.ts        # useTheme()/useColors() — 라이트/다크 동적 컬러
    ├── store/
    │   ├── uiStore.ts           # isPremiumModalVisible 등 전역 UI 상태
    │   └── themeStore.ts        # mode: system|light|dark (MMKV persist)
    └── utils/
        ├── storage.ts           # MMKV 래퍼 (토큰 관리)
        └── format.ts            # 날짜/숫자 포맷
```

## constants/colors.ts — 토큰 요약
실제 정의는 `frontend/constants/colors.ts` 참조. 현재 구조:

```ts
Colors = {
  // 브랜드
  primary: '#5B7FA6',        primaryDark: '#44638A',  primaryLight: '#E8EEF5',  primaryMuted: '#D1DBEA',
  secondary: '#7EC8E3',      secondaryDark: '#4FA8C9', secondaryLight: '#E5F4FB',
  // 기본 면
  white, background, surface (#F7F9FC, 살짝 블루틴트), surfaceElevated, border (#E5EAF0), borderStrong
  // 텍스트
  text: { primary, secondary, tertiary, disabled, inverse, accent }
  // 상태 — 전경 + 짝이 되는 배경
  status: { success, successBg, warning, warningBg, error, errorBg, info, infoBg }
  // 부가
  premium, premiumText, premiumBg, overlay, scrim, shadow
  // 다크 모드 — 라이트 토큰을 invert 하지 말고 이 객체를 쓸 것
  dark: { primary, primaryLight, secondary, secondaryLight, background, surface, surfaceElevated, border, borderStrong, text:{...}, overlay }
}
```

### 컬러 사용 규칙
- 본문/긴 텍스트 위 배경: `primary` 또는 `primaryDark` 만 사용 (secondary 위 흰 텍스트 금지 — 대비 1.9:1).
- FAB·아이콘 버튼처럼 큰 UI 컴포넌트(WCAG 3:1 기준)는 `secondary` 배경 + 흰 아이콘 허용.
- 상태 색만으로 의미 전달 금지 — 항상 아이콘/라벨 병행.
- `info` = `primary`. 별도 info 컬러를 추가하지 말 것.
- 상태 배지/배너에는 `status.*Bg` 사용 (텍스트 컬러는 짝이 되는 진한 버전).
- 다크 모드는 `useColors()` 를 통해 자동 매핑. 화면에서 `Colors.dark.*` 를 직접 참조하지 말 것.

## constants/typography.ts
```ts
Typography = {
  size: { xxs:10, xs:11, sm:13, md:15, lg:17, xl:20, xxl:24, xxxl:28, display:34 },
  weight: { regular:'400', medium:'500', semibold:'600', bold:'700' },
  lineHeight: { tight:1.4, normal:1.55, relaxed:1.75 },   // 한국어 가독성 위해 상향
  letterSpacing: { tight:-0.4, normal:-0.2, wide:0.2 },   // 한글에 살짝 음수 트래킹
  preset: { display, h1, h2, h3, title, body, bodyMedium, bodySmall, caption, label, button }
}
```

### Typography 규칙
- 화면 코드에서 직접 `fontSize/fontWeight` 조합 금지. `...Typography.preset.body` 처럼 spread.
- 새 위계가 필요하면 preset에 먼저 추가하고 화면에선 그 이름으로 참조.
- 한글 본문 줄간격은 1.55. 1.3 이하 사용 시 받침이 잘려 보일 수 있음.

## constants/spacing.ts
```ts
Spacing = {
  xs:4, sm:8, md:12, lg:16, xl:20, xxl:24, xxxl:32, xxxxl:40,
  borderRadius: { sm:8, md:12, lg:16, xl:20, xxl:28, full:9999 },
  hitSlop: { top:8, bottom:8, left:8, right:8 },   // 작은 탭 영역 보강
  touchTarget: 44,                                  // 최소 터치 타깃
  fab: { size:56, bottom:24, right:16 },
}

Elevation = { none, card, raised, floating, modal }  // iOS shadow + Android elevation
```

## constants/config.ts
```ts
Config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080',
  googleWebClientId / googleIosClientId / googleAndroidClientId,
  premiumPriceMonthly: 3900,   premiumPriceYearly: 39000,
  appStoreProductId, playStoreProductId,
  freeMaxPets: 3, freeMaxPhotosPerRecord: 2, freeMaxOcrPerMonth: 3,
  freeMaxVaccineAlerts: 2, freeMaxShareMembers: 1, freeMetricsMonths: 1,
}
```

## tailwind.config.js — 토큰 동기화
`theme.extend` 에 colors / borderRadius / fontSize 모두 연동.
- colors: `primary`, `primaryDark`, `primaryLight`, `primaryMuted`, `secondary`, `secondaryDark`, `secondaryLight`, `surface`, `border`, `borderStrong`, `premium`, `success`, `warning`, `error`, `ink.{100..900}`
- borderRadius: `sm`/`md`/`lg`/`xl`/`xxl`
- fontSize: `xs`/`sm`/`md`/`lg`/`xl`/`xxl`/`xxxl`/`display`

`className='bg-primary text-white rounded-lg'` 사용 가능. NativeWind className에 hex 코드 직접 입력 금지.
`bg-black` 은 Apple HIG 필수 스타일(Apple 로그인 버튼)에 한해 허용.

## 디자인 시스템 — 컴포넌트 선택 가이드
| 상황 | 컴포넌트 |
|---|---|
| 화면 상단 헤더 (뒤로/제목/액션) | `<ScreenHeader title="..." back actions={[...]} />` |
| 큰 페이지 타이틀 + subtitle | `<ScreenHeader variant="large" title subtitle />` |
| 섹션 구분 + 더보기 | `<SectionHeader title caption action={{label,onPress}} />` |
| 메인 액션 버튼 | `<Button variant="primary" />` |
| 보조 액션 (블루 배경) | `<Button variant="secondary" />` |
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
2. **시맨틱 프리셋**: `style={{ ...Typography.preset.body }}` 처럼 spread. `fontSize/fontWeight` 직접 조합 금지.
3. **그림자는 Elevation에서만**: `shadowOffset/Opacity` 직접 작성 금지. `...Elevation.card` 처럼 spread.
4. **터치 타깃 ≥ 44pt**: 작은 아이콘 버튼은 `hitSlop={Spacing.hitSlop}` 또는 wrapper로 44pt 보장.
5. **WCAG AA**: 본문 4.5:1, UI 3:1. 새 색 조합 도입 전에 contrast checker로 검증.
6. **공통 패턴 우선**: 인라인으로 헤더/FAB/Chip을 새로 만들지 말 것. `shared/components` 에 추가하거나 props 확장.

## Dev 로그인
- 프론트: 로그인 화면에서 `__DEV__ === true` 일 때 `🛠 Dev Login · Premium / Free` 버튼 노출.
- 백엔드: `POST /api/auth/dev-login` (`DevAuthController`). 현재 `@Profile` 제한이 풀려있어 **prod에서도 동작** — 앱 dev 빌드로 prod 백엔드를 그대로 쓰기 위한 임시 조치. 출시 전 반드시 복구.

## 다크 모드
- 인프라 (`themeStore` + `useTheme/useColors` + `_layout` StatusBar 동기화) 완료.
- 마이페이지에 시스템/라이트/다크 세그먼트 컨트롤 완료.
- `shared/components` 11개 전부 `useColors()` 마이그레이션 완료.
- 화면(`app/**`) 일부는 아직 static `Colors` 참조 — 새 화면 작성 시엔 처음부터 `useColors()` 사용.

### 화면 helper에서 hook 호출 금지
컴포넌트 함수 본문 안 helper (e.g. `SectionLabel`)에선 hook 호출 OK. **파일 상단의 일반 함수**(컴포넌트 외부) 안에서 호출하면 Rules of Hooks 위반. 그 경우 `colors`를 props로 받거나 helper를 컴포넌트화.

## shared/api/client.ts 규칙
- **요청 인터셉터**: MMKV `accessToken` → `Authorization: Bearer {token}` 헤더.
- **응답 인터셉터**:
  - `401` → `refreshToken` 으로 `POST /api/auth/refresh` 시도. 성공: 새 토큰 저장 + 원래 요청 재시도. 실패: `clearAuth()` + `router.replace('/(auth)/login')`.
  - `402` → `uiStore.showPremiumModal(error.response.data.message)`.
  - 성공 응답은 `ApiResponse<T>.data` 필드만 언래핑해서 반환.
- 멀티파트 업로드: `formData = new FormData()` + `headers: { 'Content-Type': 'multipart/form-data' }` 패턴. RN XHR 가 boundary 자동 append.
