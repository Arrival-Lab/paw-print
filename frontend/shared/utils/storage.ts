import { createMMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';
import { clearSnapshot as clearWidgetSnapshot } from '../../features/widget/widgetStorage';

const storage = createMMKV({ id: 'pawprint-storage' });

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  /** 게스트 모드 — 비-계정 기능만 접근 가능. App Store 5.1.1(v) 대응. */
  GUEST_MODE: 'guest_mode',
  /** key prefix — 사용자가 본 적 있는 페이월 메시지 표시. C3 첫 막힘 부드러운 톤 분기용. */
  PAYWALL_SEEN_PREFIX: 'paywall_seen:',
  /** 디바이스 식별자 — 백엔드의 멀티 디바이스 토큰 분리용. 한 디바이스 평생 같은 값 재사용. */
  DEVICE_ID: 'device_id',
  /** 마지막 성공한 GPS 좌표 — 병원 지도 첫 진입 시 서울 기본값 대신 사용자 지역에서 시작. */
  LAST_LOCATION: 'last_location',
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

/**
 * 디바이스 식별자 — 백엔드가 X-Device-Id 헤더로 받아 멀티 디바이스 토큰 분리 관리.
 * crypto-grade 아닌 자체 생성 (Math.random + timestamp). 디바이스당 한 번 생성 후 평생 재사용.
 * 새 native dep 추가 없이 JS-only — OTA 로 배포 가능.
 */
export const getOrCreateDeviceId = (): string => {
  const existing = storage.getString(KEYS.DEVICE_ID);
  if (existing) return existing;
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}-${Math.random().toString(36).slice(2, 11)}`;
  storage.set(KEYS.DEVICE_ID, id);
  return id;
};

/**
 * 마지막으로 성공한 GPS 좌표 캐시 — 병원 지도가 콜드 스타트 시 서울 기본값 대신
 * 사용자가 마지막에 있던 지역에서 바로 시작하게 한다. 정밀 위치는 진입 후 GPS 로 보정.
 */
export const getLastLocation = (): { lat: number; lng: number } | null => {
  const raw = storage.getString(KEYS.LAST_LOCATION);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (typeof v?.lat === 'number' && typeof v?.lng === 'number') return v;
  } catch {
    /* 손상된 값 무시 */
  }
  return null;
};
export const setLastLocation = (c: { lat: number; lng: number }): void => {
  storage.set(KEYS.LAST_LOCATION, JSON.stringify({ lat: c.lat, lng: c.lng }));
};

export const clearAuth = (): void => {
  removeAccessToken();
  removeRefreshToken();
  storage.remove(KEYS.GUEST_MODE);
  // 위젯이 로그아웃 후 이전 유저의 펫·일정을 노출하지 않게 스냅샷 제거.
  clearWidgetSnapshot();
};

/**
 * "오늘 하루 안 보기" — 카드별로 마지막 닫은 날짜(YYYY-MM-DD)를 저장.
 * 저장 날짜가 오늘이면 숨김, 날짜가 바뀌면(다음날) 자동으로 다시 보임.
 */
const todayStr = (): string => new Date().toISOString().slice(0, 10);
export const isDismissedToday = (key: string): boolean =>
  storage.getString(`dismiss:${key}`) === todayStr();
export const dismissForToday = (key: string): void =>
  storage.set(`dismiss:${key}`, todayStr());

/** 페이월 메시지 종류별 첫 노출 여부 — 메시지 자체를 키로 씀 (짧고 안정적). */
function paywallKey(message: string): string {
  return `${KEYS.PAYWALL_SEEN_PREFIX}${message.slice(0, 64)}`;
}
export const hasSeenPaywall = (message: string): boolean =>
  storage.getBoolean(paywallKey(message)) ?? false;
export const markPaywallSeen = (message: string): void =>
  storage.set(paywallKey(message), true);
