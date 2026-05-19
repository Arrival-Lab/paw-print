export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
    full: 9999,
  },
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
  touchTarget: 44,
  fab: { size: 56, bottom: 24, right: 16 },
} as const;

export const Elevation = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  card: {
    shadowColor: '#1A2433',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  raised: {
    shadowColor: '#1A2433',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  floating: {
    shadowColor: '#1A2433',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  modal: {
    shadowColor: '#1A2433',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  },
  // 방향성 있는 그림자 — 스티커가 종이 위에 살짝 떠 있는 느낌.
  // iOS는 shadowOffset 으로 좌하단 방향 표현, Android elevation 은 방향 없음 (균일 fallback).
  sticker: {
    shadowColor: '#1A2433',
    shadowOffset: { width: -3, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
} as const;
