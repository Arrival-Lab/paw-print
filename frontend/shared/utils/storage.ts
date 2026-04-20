import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'pawprint-storage' });

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

export const getAccessToken = (): string | undefined => storage.getString(KEYS.ACCESS_TOKEN);
export const setAccessToken = (token: string): void => storage.set(KEYS.ACCESS_TOKEN, token);
export const removeAccessToken = (): void => storage.delete(KEYS.ACCESS_TOKEN);

export const getRefreshToken = (): string | undefined => storage.getString(KEYS.REFRESH_TOKEN);
export const setRefreshToken = (token: string): void => storage.set(KEYS.REFRESH_TOKEN, token);
export const removeRefreshToken = (): void => storage.delete(KEYS.REFRESH_TOKEN);

export const clearAuth = (): void => {
  storage.delete(KEYS.ACCESS_TOKEN);
  storage.delete(KEYS.REFRESH_TOKEN);
};
