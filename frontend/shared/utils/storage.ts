import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'pawprint-storage' });

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

export const getAccessToken = (): string | undefined => storage.getString(KEYS.ACCESS_TOKEN);
export const setAccessToken = (token: string): void => storage.set(KEYS.ACCESS_TOKEN, token);
export const removeAccessToken = (): boolean => storage.remove(KEYS.ACCESS_TOKEN);

export const getRefreshToken = (): string | undefined => storage.getString(KEYS.REFRESH_TOKEN);
export const setRefreshToken = (token: string): void => storage.set(KEYS.REFRESH_TOKEN, token);
export const removeRefreshToken = (): boolean => storage.remove(KEYS.REFRESH_TOKEN);

export const clearAuth = (): void => {
  storage.remove(KEYS.ACCESS_TOKEN);
  storage.remove(KEYS.REFRESH_TOKEN);
};
