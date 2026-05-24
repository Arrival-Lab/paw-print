import { createMMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';

const storage = createMMKV({ id: 'pawprint-storage' });

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  /** 게스트 모드 — 비-계정 기능만 접근 가능. App Store 5.1.1(v) 대응. */
  GUEST_MODE: 'guest_mode',
  /** key prefix — 사용자가 본 적 있는 페이월 메시지 표시. C3 첫 막힘 부드러운 톤 분기용. */
  PAYWALL_SEEN_PREFIX: 'paywall_seen:',
} as const;

// 토큰은 SecureStore (iOS Keychain / Android Keystore) 에 저장. 평문 MMKV 노출 차단.
// SecureStore 는 async-only 라 axios 인터셉터 등 동기 접근 경로를 위해 메모리 캐시 유지.
// 앱 시작 시 initAuthStorage() 로 캐시 1회 워밍 + MMKV→SecureStore 마이그레이션 수행.
let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = null;
let initialized = false;

/**
 * 앱 부팅 시 1회 호출. _layout 의 AppContent 가 init 완료 전까진 SplashScreen 유지.
 * 1) MMKV 에 남은 토큰 있으면 SecureStore 로 옮기고 MMKV 에선 제거 (기존 유저 무중단 마이그레이션)
 * 2) SecureStore 값을 메모리 캐시로 로드
 */
export async function initAuthStorage(): Promise<void> {
  if (initialized) return;
  try {
    const legacyAccess = storage.getString(KEYS.ACCESS_TOKEN);
    const legacyRefresh = storage.getString(KEYS.REFRESH_TOKEN);
    if (legacyAccess) {
      await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, legacyAccess);
      storage.remove(KEYS.ACCESS_TOKEN);
    }
    if (legacyRefresh) {
      await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, legacyRefresh);
      storage.remove(KEYS.REFRESH_TOKEN);
    }
    cachedAccessToken = await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
    cachedRefreshToken = await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  } finally {
    initialized = true;
  }
}

export const getAccessToken = (): string | undefined => cachedAccessToken ?? undefined;
export const setAccessToken = (token: string): void => {
  cachedAccessToken = token;
  // fire-and-forget — 다음 콜드 스타트 전 디스크 sync 보장됨 (Keychain 동기 write)
  SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token).catch((e) =>
    console.warn('[storage] setAccessToken persist failed', e),
  );
};
export const removeAccessToken = (): void => {
  cachedAccessToken = null;
  SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN).catch(() => undefined);
};

export const getRefreshToken = (): string | undefined => cachedRefreshToken ?? undefined;
export const setRefreshToken = (token: string): void => {
  cachedRefreshToken = token;
  SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token).catch((e) =>
    console.warn('[storage] setRefreshToken persist failed', e),
  );
};
export const removeRefreshToken = (): void => {
  cachedRefreshToken = null;
  SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN).catch(() => undefined);
};

export const isGuestMode = (): boolean => storage.getBoolean(KEYS.GUEST_MODE) ?? false;
export const setGuestMode = (v: boolean): void => storage.set(KEYS.GUEST_MODE, v);
export const clearGuestMode = (): void => { storage.remove(KEYS.GUEST_MODE); };

export const clearAuth = (): void => {
  removeAccessToken();
  removeRefreshToken();
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
