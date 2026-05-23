# Frontend — React Native (Expo SDK 54)

## 디렉토리 구조
```
frontend/
├── app/                         # expo-router 라우팅만. 비즈니스 로직 없음.
│   ├── _layout.tsx              # QueryClient, SafeArea, PremiumModal, 인증 라우팅
│   ├── (auth)/login.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx          # 하단 탭바 (중앙 솟은 홈 + glass background)
│   │   ├── diary.tsx            # 다이어리 캘린더
│   │   ├── daily.tsx            # 일상 (매일체크·수치 sub-tabs)
│   │   ├── index.tsx            # 홈 (펫 카드 + 빠른 액션 + 다가오는 일정)
│   │   ├── health.tsx           # 건강 (진료·백신 sub-tabs)
│   │   ├── care.tsx             # 옛 경로 redirect 만 (→ /daily?tab=daily-check)
│   │   └── mypage.tsx           # 더보기 (프로필 + 메뉴 그룹들 + 커뮤니티 진입 + 테마 picker)
│   ├── community.tsx            # 보호자 커뮤니티 (stack — 더보기에서 진입)
│   ├── pets/                    # 펫 리스트 + 상세 + 생성
│   ├── records/                 # 진료기록 상세 + 작성 (appointmentId prefill 지원)
│   ├── appointments/new.tsx     # 진료일정 작성
│   ├── share/accept.tsx         # 공유 초대 deep link (/share/index 는 제거됨)
│   └── ... (hospital, notifications, notices, subscription, vaccines, metrics)
├── constants/                   # ★ 변경 최소화 핵심.
│   ├── colors.ts                # 라이트/다크 + glass + status bg
│   ├── typography.ts            # size/weight/lineHeight/letterSpacing/preset
│   ├── spacing.ts               # 여백/패딩/반경/elevation/hitSlop/fab
│   ├── config.ts                # 환경변수, 가격, 무료 한도
│   └── index.ts
├── features/                    # 기능별 모듈 (api/hooks/components/store/types)
│   ├── auth/  pet/  record/  diary/  vaccine/  food/  metric/
│   ├── hospital/  share/  community/  subscription/  appointment/
│   ├── home/   care/   onboarding/  weather/
└── shared/
    ├── api/
    │   ├── client.ts            # axios (JWT 인터셉터, 401 refresh, 402 PremiumModal)
    │   └── types.ts             # ApiResponse<T>, PageResponse<T>
    ├── components/              # 디자인 시스템 primitives (모두 useColors)
    │   ├── Button.tsx           # 6 variants × 3 sizes
    │   ├── Card.tsx             # flat/outlined/elevated/tinted × 4 padding
    │   ├── Badge.tsx · Chip.tsx · Divider.tsx · Fab.tsx · ScreenHeader.tsx
    │   ├── SectionHeader.tsx · EmptyState.tsx · LoadingSpinner.tsx
    │   ├── PremiumModal.tsx · PremiumLock.tsx · UsageMeter.tsx
    │   ├── DateInput.tsx · DatePickerModal.tsx · TimePickerModal.tsx
    │   ├── CircularProgress.tsx · Text.tsx
    │   ├── HospitalAutocomplete.tsx     # 병원명 추천 dropdown (records + appointments union)
    │   └── Glass*.tsx                   # glass 시스템 (아래 절 참조)
    ├── hooks/useTheme.ts        # useTheme()/useColors() — 라이트/다크 동적 컬러
    ├── store/
    │   ├── uiStore.ts           # isPremiumModalVisible 등 전역 UI 상태
    │   ├── themeStore.ts        # mode: system|light|dark (MMKV persist)
    │   └── petFilterStore.ts    # 홈 필터의 selectedPetId 글로벌 sync
    └── utils/
        ├── storage.ts           # MMKV 래퍼 (토큰 관리)
        └── format.ts            # 날짜/숫자 포맷
```

## constants/colors.ts — 토큰 요약
```ts
Colors = {
  // 브랜드 (palette 매핑)
  primary: '#F4A8B8',  primaryDark: '#C47E8A',  primaryLight: '#FDF1F4',  primaryMuted: '#FADEE5',
  secondary: '#F9D98C',  secondaryDark: '#D9B05B',  secondaryLight: '#FEF8E8',
  // 기본 면
  white: '#FFFFFF',  background: '#FFFFFF',  surface: '#FBF9F5' (warm tint),
  surfaceElevated: '#FFFFFF',  border: '#EDE7E0',  borderStrong: '#FADEE5' (pink100)
  // 텍스트
  text: { primary: ink900, secondary: ink500, tertiary: ink300,
          disabled: ink100, inverse: paper, accent: primaryDark }
  // 상태 — sage success (#7EAD9B, dearmi 차용), amber warning, red error
  status: { success, successBg, warning, warningBg, error, errorBg,
            info = primaryDark, infoBg = primaryLight }
  // premium 라벤더 — 핑크/노랑과 분리
  premium: '#9B6BCC',  premiumText: '#3D2B6B',  premiumBg: '#F0E8F8'
  overlay, scrim, shadow
  // glass — BlurView 위에 얹는 알파 톤 (intensity 50 기준)
  glass: {
    surface: 'rgba(255,255,255,0.38)',  surfaceStrong: 'rgba(255,255,255,0.55)',
    primaryTint: 'rgba(244,168,184,0.18)',  highlight: 'rgba(255,255,255,0.32)',
    border: 'rgba(255,255,255,0.45)',  borderSoft: 'rgba(255,255,255,0.22)',
    overlay: 'rgba(26,36,51,0.22)',
  }
  // 다크 모드 — 라이트 invert 가 아닌 별도 객체
  dark: { primary: pink300, primaryDark: pink500 (더 밝은 pink),
          primaryLight: '#241E22', secondary, secondaryDark, secondaryLight,
          background: '#0D0D0F', surface: '#18181B', surfaceElevated: '#232328',
          border: '#2F2F35', borderStrong: '#404048', text, overlay, glass }
}
```

### 컬러 사용 규칙
- **흰 텍스트는 `primaryDark` (#C47E8A) 또는 `status.error` 위에서만** — 그마저도 큰 글자(18sp+ Bold) 또는 UI 그래픽에 한정. 본문 14sp 는 AA 미달.
- `primary`·`secondary` 는 어두운 텍스트 (`text.primary`) 와만 조합.
- 칩·아이콘 동그라미 배경처럼 텍스트가 안 올라가는 부드러운 영역엔 `primary`·`primaryLight`·`secondary`·`secondaryLight` 자유롭게.
- 상태 색만으로 의미 전달 금지 — 항상 아이콘/라벨 병행.
- `info` = `primaryDark` (코랄 톤). 별도 info 컬러 추가 금지.
- 상태 배지/배너에는 `status.*Bg` 사용 (텍스트 컬러는 짝이 되는 진한 버전).
- 다크 모드는 `useColors()` 자동 매핑. 화면에서 `Colors.dark.*` 직접 참조 금지.

## constants/typography.ts
```ts
Typography = {
  size: { xxs:10, xs:11, sm:13, md:15, lg:17, xl:20, xxl:24, xxxl:28, display:34 },
  weight: { regular:'400', medium:'500', semibold:'600', bold:'700' },
  lineHeight: { tight:1.4, normal:1.55, relaxed:1.75 },   // 한국어 가독성 위해 상향
  letterSpacing: { tight:-0.4, normal:-0.2, wide:0.2 },
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
  hitSlop: { top:8, bottom:8, left:8, right:8 },
  touchTarget: 44,
  fab: { size:56, bottom:24, right:16 },
}

Elevation = { none, card, raised, floating, modal }  // iOS shadow + Android elevation
```

**화면 horizontal padding 통일: `Spacing.xl` (20px)**. 카드/모달 내부 padding 은 `Spacing.lg` (16px) 유지 — 화면 가장자리 breathing 만 +4px 추가하는 규칙.

## constants/config.ts
```ts
Config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080',
  googleWebClientId / googleIosClientId / googleAndroidClientId,
  premiumPriceMonthly: 3900,   premiumPriceYearly: 39000,
  appStoreProductId, playStoreProductId,
  freeMaxPets: 3, freeMaxPhotosPerRecord: 5, freeMaxOcrPerMonth: 5,
  freeMaxVaccineAlerts: 3, freeMaxShareMembers: 1, freeMetricsMonths: 1,
}
```

## Glass 시스템 — frosted UI
탭바·모달·바텀시트는 glassmorphism (BlurView + 알파 surface). 5개 컴포넌트로 관리:

| 컴포넌트 | 용도 |
|---|---|
| `<GlassHeader>` | absolute top 헤더. `onHeightChange` 콜백으로 콘텐츠 paddingTop 측정. ScreenHeader 의 variant=transparent 사용. |
| `<GlassTabBarBackground>` | 하단 탭바 배경. expo-router Tabs 의 `tabBarBackground` 로 등록. 상단 1px specular edge. |
| `<GlassOverlay>` | 모달 backdrop (BlurView + glass.overlay tint). 탭하면 onClose. |
| `<GlassCard>` | floating card — intensity 50 + glass tint + 1px top specular edge + Elevation shadow. tone='surface'/'surfaceStrong'/'primaryTint' 선택. |
| `<GlassStickyBar>` | 헤더 아래 sticky sub-tab bar (예: 진료 sub-tab). |

기본 BlurView intensity 50 (예외: `GlassOverlay` 60). `tint={isDark ? 'dark' : 'light'}` + Android 는 `experimentalBlurMethod="dimezisBlurView"`.

탭 화면 패턴:
```tsx
<View style={{ flex: 1, backgroundColor: Colors.surface }}>
  <ScrollView contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: tabBarHeight + ... }}>
    ...content
  </ScrollView>
  <GlassHeader title="..." onHeightChange={setHeaderHeight} />
</View>
```
헤더가 absolute 라서 컨텐츠는 측정된 헤더 높이만큼 위 padding 필요.

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
| 화면 상단 헤더 (탑레벨 탭) | `<GlassHeader title="..." onHeightChange />` |
| 스택 화면 헤더 (back) | `<ScreenHeader title back actions />` |
| 큰 페이지 타이틀 + subtitle | `<ScreenHeader variant="large" title subtitle />` |
| 섹션 구분 + 더보기 | `<SectionHeader title caption action={{label,onPress}} />` |
| 메인 액션 버튼 | `<Button variant="primary" />` |
| 보조 액션 | `<Button variant="secondary" />` |
| 옅은 강조 액션 | `<Button variant="tonal" />` (primaryLight 배경) |
| 텍스트만 액션 | `<Button variant="ghost" />` |
| 외곽선 액션 | `<Button variant="outline" />` |
| 위험 액션 (삭제 등) | `<Button variant="danger" />` |
| 우하단 추가 액션 | `<Fab onPress icon="plus" />` |
| 필터 칩 / 카테고리 토글 | `<Chip label selected onPress />` |
| 상태 표시 라벨 | `<Badge tone="success\|warning\|premium\|neutral">텍스트</Badge>` |
| 정보 그룹 박스 (solid) | `<Card variant="elevated\|outlined\|tinted\|flat" padding="sm\|md\|lg" />` |
| 글래스 카드 (떠있는 느낌) | `<GlassCard tone="surface\|surfaceStrong" padding="md" />` |
| 바텀시트·모달 backdrop | `<GlassOverlay onPress={onClose}>{children}</GlassOverlay>` |
| 데이터 없음 | `<EmptyState icon title description action />` |
| 로딩 | `<LoadingSpinner label />` 또는 `inline` |
| 1px 구분선 | `<Divider />` |
| 병원명 입력 (autocomplete) | `<HospitalAutocomplete petId value onChange />` |
| 무료 한도 사용량 표시 | `<UsageMeter current max label unit icon />` |
| 날짜 입력 | `<DateInput value onChange title />` |

## 디자인 시스템 — 핵심 원칙
1. **토큰 우선**: 화면에서 직접 색/크기 하드코딩 금지. 항상 Colors/Typography/Spacing/Elevation 참조.
2. **시맨틱 프리셋**: `style={{ ...Typography.preset.body }}` 처럼 spread. `fontSize/fontWeight` 직접 조합 금지.
3. **그림자는 Elevation 또는 GlassCard 에서만**: `shadowOffset/Opacity` 직접 작성 금지.
4. **터치 타깃 ≥ 44pt**: 작은 아이콘 버튼은 `hitSlop={Spacing.hitSlop}` 또는 wrapper로 44pt 보장.
5. **WCAG AA**: 본문 4.5:1, UI 3:1. 새 색 조합 도입 전에 contrast checker로 검증.
6. **공통 패턴 우선**: 인라인으로 헤더/FAB/Chip을 새로 만들지 말 것. `shared/components` 에 추가하거나 props 확장.
7. **화면 horizontal padding `Spacing.xl` 통일** — 카드 내부 padding 은 `Spacing.lg` 유지.
8. **외곽선 최소화** — 카드 border 보다 dividers + paddings 로 그룹핑. 사용자 명시적 선호.

## 하단 탭 IA — 다이어리 / 일상 / 홈 / 건강 / 더보기
무게가 비슷한 항목끼리 2개 그룹으로 묶음. 커뮤니티는 더보기 메뉴에 단독 섹션.

### 일상 탭 (`daily.tsx`)
- **매일체크 (CareTab, `features/care/`)** — 시간대별 그룹 (아침·점심·오후·저녁·취침전) + 색 dot 카테고리 + 1행 진행률 슬림 라인.
- **수치 (MetricsTab, `features/metric/`)** — METRIC_TABS 칩 (체중/BUN/CREATININE/CUSTOM) + MetricChart (chart-kit, fill 5% opacity) + 기록 리스트.
- 기본 sub-tab: `daily-check`. 둘 다 펫별 필수 → 펫 미선택 시 안내.

### 건강 탭 (`health.tsx`)
- **진료 (MedicalTab, `features/medical/`)** — 단일 SectionList — ListHeaderComponent 에 "다가오는 예약" 섹션(최대 3개) + 본문에 월별 timeline 진료기록. 단일 FAB → 4-옵션 ActionSheet (AI 촬영 / 갤러리 / 직접 입력 / 진료일정 등록). AppointmentRow tap → `AppointmentDetailSheet` 노출 — 3단계 진행 타임라인 (예약 → 방문 → 기록) + "진료기록 작성/보기" CTA. 펫 "전체" 모드는 AllMedicalTab.
- **백신 (VaccinesTab, `features/vaccine/`)** — 슬림 활성 알림 progress + 행 리스트. 펫별 필수.
- 기본 sub-tab: `medical`. 백신 D-day 배지(`useUpcomingVaccinesCount`)는 _layout 의 건강 탭에 표시.

### 더보기 — 커뮤니티는 단독 섹션
`(tabs)/mypage.tsx` 의 MENU_SECTIONS 에 `커뮤니티` 그룹 (route: `/community`). community 화면은 `app/community.tsx` (stack — back 버튼 노출).

## Dev 로그인
- 프론트: 로그인 화면에서 `__DEV__ === true` 일 때 `🛠 Dev Login · Premium / Free` 버튼 노출.
- 백엔드: `POST /api/auth/dev-login` (`DevAuthController`) — **`@Profile("local")` 적용**. prod 배포 시 빈 등록 안 되어 404. 로컬 백엔드 띄울 때만 동작 (Play 스토어 검토 대비 차단됨).

## 다크 모드
- 인프라 (`themeStore` + `useTheme/useColors` + `_layout` StatusBar 동기화) 완료.
- 더보기 탭의 "테마" 행 → ThemePickerSheet (시스템/라이트/다크 3 옵션, bottom sheet) — 카드형 segmented 제거됨.
- `shared/components` 전부 `useColors()` 마이그레이션 완료.

### 화면 helper에서 hook 호출 금지
컴포넌트 함수 본문 안 helper (e.g. `SectionLabel`)에선 hook 호출 OK. **파일 상단의 일반 함수**(컴포넌트 외부) 안에서 호출하면 Rules of Hooks 위반. 그 경우 `colors`를 props로 받거나 helper를 컴포넌트화.

## shared/api/client.ts 규칙
- **요청 인터셉터**: MMKV `accessToken` → `Authorization: Bearer {token}` 헤더.
- **응답 인터셉터**:
  - `401` → `refreshToken` 으로 `POST /api/auth/refresh` 시도. 성공: 새 토큰 저장 + 원래 요청 재시도. 실패: `clearAuth()` + `router.replace('/(auth)/login')`.
  - `402` → `uiStore.showPremiumModal(error.response.data.message)`.
  - 성공 응답은 `ApiResponse<T>.data` 필드만 언래핑해서 반환.
- **타입 추론**: `client.get<T>(...)` → `Promise<T>` 로 직접 추론된다. 내부적으로 axios 인스턴스(`axiosInstance`)를 typed facade 로 감싸 두 번째 generic `R = T` 를 지정 — 호출부는 `await client.get<Foo>(...)` 결과를 그대로 `Foo` 로 사용하면 된다. `.data` 한 번 더 까는 코드 금지. `(res as any)` / `as unknown as T` 캐스트로 우회하는 패턴도 금지 (이전 버전의 잔재 — 발견 시 제거).
- 멀티파트 업로드: `formData = new FormData()` + `headers: { 'Content-Type': 'multipart/form-data' }` 패턴. RN XHR 가 boundary 자동 append.

## 푸시 알림 — Expo Push Service
- 토큰 등록: `Notifications.getDevicePushTokenAsync()` (APNs / FCM device token) — 백엔드로 전송 → 백엔드가 `https://exp.host/--/api/v2/push/send` 로 발송.
- RNFirebase 미사용 (Expo SDK 54 + use_frameworks 충돌). FCM 백엔드 직접 호출도 미사용.
- 알림 탭 시 deep link: `pawprint://care/check?petId=...&itemId=...` 등.

## 진료일정 ↔ 진료기록 양방향 링크
- Record 에 `appointmentId?: number | null` 필드 (V20 migration).
- Appointment 에 `linkedRecordId?: number | null` 필드 (백엔드가 lookup 해서 채움).
- AppointmentDetailSheet 에서 3-stage timeline + "이 일정으로 진료기록 작성" CTA → RecordForm 으로 `appointmentId` + prefill 전달.
- RecordCard 에 `appointmentId` 있으면 "예약 연결" chip 표시.

## 케어 공유 (Share)
- 펫 상세 화면 안 `<PetShareSection pet={pet}>` 에 통합. mypage 메뉴에 별도 진입 없음.
- 펫 리스트 행에 공유 상태 표시: "X명과 공유 중" (소유) / "X님이 공유함" (공유받음).
- 백엔드 `Pet.sharedMemberCount` (ACCEPTED count, 소유자 제외) — `GET /api/pets` 응답에 포함.
- 초대 코드 입력은 mypage `초대 코드로 공유 수락` → `<InviteCodeDialog>` 모달.

## 홈 화면 — 날씨 기반 케어 팁
홈 진입 시 `useFocusEffect` 로 `petFilterStore.selectedPetId = null` 강제 → 항상 "전체" 모드 시작.

상단에 `<HomeCareTipCard>` (`features/weather/`):
- `useWeatherTip()` 훅이 expo-location 으로 좌표 받아 백엔드 `/api/weather/care-tip?lat&lng` 호출.
- 백엔드가 KMA 기상청 + KECO 대기질 데이터 + 트리거 평가 (RAIN/HOT/COLD/AIR_BAD/UV_HIGH 등) → 적절한 케어 팁 반환.
- 트리거 NONE 또는 위치 권한 거부 시 `MonthlyCareGuideModal.getMonthlyTip()` 으로 폴백 (월별 정적 팁).
- 카드 탭 시 `MonthlyCareGuideModal` 풀스크린 상세.

## 닉네임 (Nickname)
User 에 `nickname?: string | null` 필드. 미설정 시 mypage 프로필 카드에 "닉네임을 설정해주세요" 노출 → `<NicknameEditModal>` 로 설정. 닉네임 없으면 인증 후 강제 onboarding (`app/_layout.tsx` 가드).
