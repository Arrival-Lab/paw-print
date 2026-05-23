import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'pawprint-storage' });

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  /** 게스트 모드 — 비-계정 기능만 접근 가능. App Store 5.1.1(v) 대응. */
  GUEST_MODE: 'guest_mode',
  /** key prefix — 사용자가 본 적 있는 페이월 메시지 표시. C3 첫 막힘 부드러운 톤 분기용. */
  PAYWALL_SEEN_PREFIX: 'paywall_seen:',
} as const;

export const getAccessToken = (): string | undefined => storage.getString(KEYS.ACCESS_TOKEN);
export const setAccessToken = (token: string): void => storage.set(KEYS.ACCESS_TOKEN, token);
export const removeAccessToken = (): boolean => storage.remove(KEYS.ACCESS_TOKEN);

export const getRefreshToken = (): string | undefined => storage.getString(KEYS.REFRESH_TOKEN);
export const setRefreshToken = (token: string): void => storage.set(KEYS.REFRESH_TOKEN, token);
export const removeRefreshToken = (): boolean => storage.remove(KEYS.REFRESH_TOKEN);

export const isGuestMode = (): boolean => storage.getBoolean(KEYS.GUEST_MODE) ?? false;
export const setGuestMode = (v: boolean): void => storage.set(KEYS.GUEST_MODE, v);
export const clearGuestMode = (): void => { storage.remove(KEYS.GUEST_MODE); };

export const clearAuth = (): void => {
  storage.remove(KEYS.ACCESS_TOKEN);
  storage.remove(KEYS.REFRESH_TOKEN);
  storage.remove(KEYS.GUEST_MODE);
};

/** 페이월 메시지 종류별 첫 노출 여부 — 메시지 자체를 키로 씀 (짧고 안정적). */
function paywallKey(message: string): string {
  return `${KEYS.PAYWALL_SEEN_PREFIX}${message.slice(0, 64)}`;
}
export const hasSeenPaywall = (message: string): boolean =>
  storage.getBoolean(paywallKey(message)) ?? false;
export const markPaywallSeen = (message: string): void =>
  storage.set(paywallKey(message), true);
