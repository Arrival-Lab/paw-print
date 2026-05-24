// 색상 대비 (WCAG):
//   #F4A8B8 (primary, 로즈핑크) + 흰 → 2.1:1 ❌ / + ink900 → 7.5:1 ✓ AAA
//   #C47E8A (primaryDark, 부드러운 로즈) + 흰 → 3.7:1 (큰 텍스트·UI 통과, 본문 14sp 는 AA 미달) — CTA·탭 active 등 굵은 흰 텍스트 가능
//   #F9D98C (secondary, 버터 옐로우) + 흰 → 1.4:1 ❌ / + ink900 → 12:1 ✓ AAA
//   #D9B05B (secondaryDark, 진한 노랑) + 흰 → 2.7:1 ❌ / + ink900 → 6.8:1 ✓
// → 하이라이트(탭 active, chip selected, CTA, 캘린더 today) = primary 계열 = 로즈핑크.
//   노랑(secondary) 은 톤/일러스트·promotion banner 등 부드러운 배경.
//   premium 배지는 노랑과 충돌 회피를 위해 라벤더 톤으로 분리.
const palette = {
  // 버터 옐로우 — primary 계열
  yellow50: '#FEF8E8',
  yellow100: '#FDEFCC',
  yellow200: '#FCE5A8',
  yellow300: '#F9D98C',
  yellow500: '#E6C16E',
  yellow700: '#D9B05B',
  yellow900: '#8C7036',
  // 페일 핑크 — secondary 계열
  pink50: '#FDF1F4',
  pink100: '#FADEE5',
  pink300: '#F4A8B8',
  pink500: '#DC8298',
  pink700: '#C47E8A',
  // 잉크/뉴트럴
  ink900: '#1A2433',
  ink700: '#2A3547',
  ink500: '#5C6577',
  ink300: '#8E96A8',
  ink100: '#C5CAD3',
  paper: '#FFFFFF',
  paperTint: '#FBF9F5',  // 살짝 따뜻한 백
  divider: '#EDE7E0',    // 살짝 따뜻한 보더
  // 상태 (universal) — green 은 dear-m-i 의 sage 톤 차용
  green: '#7EAD9B',
  amber: '#E89B2A',
  red: '#D64545',
  // premium — 노랑과 충돌 피해 라벤더 톤으로
  premium: '#9B6BCC',
  premiumInk: '#3D2B6B',
} as const;

export const Colors = {
  // primary = 로즈핑크 (하이라이트), secondary = 버터 옐로우 (톤/일러스트)
  primary: palette.pink300,
  primaryDark: palette.pink700,
  primaryLight: palette.pink50,
  primaryMuted: palette.pink100,
  secondary: palette.yellow300,
  secondaryDark: palette.yellow700,
  secondaryLight: palette.yellow50,
  white: palette.paper,
  background: palette.paper,
  surface: palette.paperTint,
  surfaceElevated: palette.paper,
  border: palette.divider,
  borderStrong: palette.pink100,
  text: {
    primary: palette.ink900,
    secondary: palette.ink500,
    tertiary: palette.ink300,
    disabled: palette.ink100,
    inverse: palette.paper,
    accent: palette.pink700,
  },
  status: {
    success: palette.green,
    successBg: '#EEF6F2',
    warning: palette.amber,
    warningBg: '#FBEFD7',
    error: palette.red,
    errorBg: '#FADCDC',
    info: palette.pink700,
    infoBg: palette.pink50,
  },
  premium: palette.premium,
  premiumText: palette.premiumInk,
  premiumBg: '#F0E8F8',
  overlay: 'rgba(26,36,51,0.5)',
  scrim: 'rgba(26,36,51,0.32)',
  shadow: palette.ink900,
  glass: {
    // 더 투명하게 — BlurView intensity 50 과 결합 시 진짜 frosted glass 톤
    surface: 'rgba(255,255,255,0.38)',
    surfaceStrong: 'rgba(255,255,255,0.55)',
    primaryTint: 'rgba(244,168,184,0.18)',
    // 위쪽 specular highlight — 빛이 윗면에 닿는 효과
    highlight: 'rgba(255,255,255,0.32)',
    border: 'rgba(255,255,255,0.45)',
    borderSoft: 'rgba(255,255,255,0.22)',
    overlay: 'rgba(26,36,51,0.22)',
  },
  dark: {
    primary: palette.pink300,
    primaryDark: palette.pink500,
    // 시즌 카드·펫 ring 배경 — 거의 무채색 다크에 살짝 핑크 hue.
    primaryLight: '#241E22',
    secondary: palette.yellow300,
    secondaryDark: palette.yellow500,
    secondaryLight: '#252220',
    // OLED 스타일 무채색 다크 — 거의 검정에 살짝 따뜻한 미세 톤
    background: '#0D0D0F',
    surface: '#18181B',
    surfaceElevated: '#232328',
    border: '#2F2F35',
    borderStrong: '#404048',
    text: {
      primary: '#F2F2F4',
      secondary: '#A8A8AC',
      tertiary: '#6F6F75',
      disabled: '#3A3A3F',
      inverse: palette.ink900,
      accent: palette.pink300,
    },
    overlay: 'rgba(0,0,0,0.6)',
    glass: {
      // 다크는 알파 더 낮추면 가독성 떨어짐 — 0.35/0.55 정도
      surface: 'rgba(35,35,40,0.35)',
      surfaceStrong: 'rgba(35,35,40,0.55)',
      primaryTint: 'rgba(244,168,184,0.14)',
      // 다크 모드 specular — 채도 낮은 화이트
      highlight: 'rgba(255,255,255,0.10)',
      border: 'rgba(255,255,255,0.14)',
      borderSoft: 'rgba(255,255,255,0.08)',
      overlay: 'rgba(0,0,0,0.4)',
    },
  },
  // 외부 브랜드 색 (테마화 불가) — Apple HIG/Google 브랜드 가이드 강제
  // Apple HIG: Sign in with Apple 버튼은 검정/흰 only. Google: G 마크는 Google Blue + 흰 배경.
  social: {
    appleBlack: '#000000',
    googleBlue: '#4285F4',
  },
} as const;
