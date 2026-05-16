// 타이포 3단계 — heading(16) / body(14) / caption(12)
// 모든 화면은 이 세 단계 안에서만 글씨 크기 결정. 강조는 weight 로 차별.
// 기존 preset 키 (display·h1·h2·h3·title·bodyMedium·bodySmall·label·button) 는
// 호환성 위해 유지하되 3단계 중 하나로 매핑됨.
// lineHeight 는 한국어 받침 잘림 방지를 위해 1.5+ 적용 (CLAUDE.md 가이드 1.55).
const heading = { fontSize: 16, lineHeight: 24, letterSpacing: -0.2 };
const body = { fontSize: 14, lineHeight: 22, letterSpacing: -0.2 };
const caption = { fontSize: 12, lineHeight: 18, letterSpacing: -0.2 };

export const Typography = {
  size: {
    // 3단계
    caption: 12,
    body: 14,
    heading: 16,
    // 호환 키 — 모두 3단계로 흡수
    xxs: 12,
    xs: 12,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 16,
    xxl: 16,
    xxxl: 16,
    display: 16,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.4,
    normal: 1.55,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: -0.4,
    normal: -0.2,
    wide: 0.2,
  },
  preset: {
    // ★ 핵심 3단계
    heading: { ...heading, fontWeight: '700' },
    body: { ...body, fontWeight: '400' },
    caption: { ...caption, fontWeight: '400' },

    // ── 호환 매핑 (모두 3단계 중 하나로 흡수) ──
    display: { ...heading, fontWeight: '700' },
    h1: { ...heading, fontWeight: '700' },
    h2: { ...heading, fontWeight: '700' },
    h3: { ...heading, fontWeight: '600' },
    title: { ...heading, fontWeight: '600' },
    bodyMedium: { ...body, fontWeight: '500' },
    bodySmall: { ...caption, fontWeight: '400' },
    label: { ...caption, fontWeight: '600', letterSpacing: 0.2 },
    button: { ...body, fontWeight: '600' },
  },
} as const;
