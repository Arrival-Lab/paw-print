import axios, { AxiosRequestConfig } from 'axios';
import { Config } from '../../constants';
import * as storage from '../utils/storage';
import type { ApiResponse } from './types';

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];
// refresh 최근 실패 시각 — cold start 직후 깨진 토큰으로 모든 요청이 401 → refresh → 실패 →
// clearAuth 무한 패턴 방지. 한 번 실패하면 짧은 backoff 동안 refresh 시도 자체를 skip 하고
// 곧장 로그아웃 처리해 Fold7 freeze 같은 패턴 차단.
let lastRefreshFailAt = 0;
const REFRESH_FAIL_BACKOFF_MS = 30_000;
// 401 alert 중복 방지 — 동시 다발 요청이 동시에 401 받아도 한 번만 노출.
let lastAuthExpiredAlertAt = 0;
const AUTH_EXPIRED_ALERT_COOLDOWN_MS = 5_000;

/**
 * refresh 최종 실패 시 공통 처리 — 토큰 clear + 캐시 비움 + 로그인 화면 이동 + 1회 안내 Alert.
 * 호출부 두 곳(즉시 backoff / refresh 실패 catch)에서 동일 처리 보장.
 */
async function handleAuthExpired(): Promise<void> {
  storage.clearAuth();
  // 이전 계정 캐시 누수 방지 — 다음 로그인 사용자에게 펫/일정/기록이 새지 않게.
  const { queryClient } = await import('./queryClient');
  queryClient.clear();
  const { router } = await import('expo-router');
  router.replace('/(auth)/login');
  // 사용자가 갑자기 로그인 화면으로 튕긴 이유를 알 수 있도록 1회 안내.
  // 동시 다발 401 에도 cooldown 안에서는 한 번만 노출.
  if (Date.now() - lastAuthExpiredAlertAt > AUTH_EXPIRED_ALERT_COOLDOWN_MS) {
    lastAuthExpiredAlertAt = Date.now();
    const { Alert } = await import('react-native');
    Alert.alert('로그인이 필요해요', '세션이 만료되었어요. 다시 로그인해주세요.');
  }
}

const axiosInstance = axios.create({
  baseURL: Config.apiBaseUrl,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  const token = storage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    const apiResponse = response.data as ApiResponse<unknown>;
    return apiResponse.data as any;
  },
  async (error) => {
    const originalRequest: AxiosRequestConfig & { _retry?: boolean } = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // 게스트 모드: refresh 시도/redirect 둘 다 스킵. 호출부가 LoginPromptModal 로 처리.
      // App Store 5.1.1(v) 대응 — 비-계정 기능 접근 중 401 떨어져도 강제 로그아웃 X.
      if (storage.isGuestMode()) {
        return Promise.reject(error);
      }

      // 최근 refresh 실패 → 또 시도해봐야 같은 결과. 곧장 로그아웃 처리해 무한 401 loop 차단.
      if (Date.now() - lastRefreshFailAt < REFRESH_FAIL_BACKOFF_MS) {
        await handleAuthExpired();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = storage.getRefreshToken();
        // refreshToken 이 비어있으면 백엔드 @NotBlank 400 만 반복 유발 — 곧장 로그아웃.
        if (!refreshToken) {
          throw new Error('no refresh token');
        }
        const { data } = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
          `${Config.apiBaseUrl}/api/auth/refresh`,
          { refreshToken },
        );
        const { accessToken, refreshToken: newRefreshToken } = data.data;
        storage.setAccessToken(accessToken);
        storage.setRefreshToken(newRefreshToken);

        refreshQueue.forEach((cb) => cb(accessToken));
        refreshQueue = [];

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return axiosInstance(originalRequest);
      } catch {
        refreshQueue = [];
        lastRefreshFailAt = Date.now();
        await handleAuthExpired();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 402) {
      const { useUiStore } = await import('../store/uiStore');
      useUiStore.getState().showPremiumModal(error.response.data?.message);
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

// response interceptor 가 ApiResponse<T>.data 만 unwrap 해서 반환하므로
// axios 의 `Promise<AxiosResponse<T>>` 시그니처와 실제 런타임이 어긋난다.
// 이 facade 가 호출부에 `Promise<T>` 를 직접 노출해 타입 추론을 맞춰 준다.
//
// 메서드 shorthand (`get<T>(...) {...}`) 형태로 작성. `<T,>` arrow generic 은 .tsx
// JSX 충돌 회피용 문법이라 .ts 에선 흔치 않아서 일부 minifier/transformer 가
// release 빌드에서 잘못 처리하는 정황이 있어 안전한 메서드 shorthand 로 통일.
interface ApiClient {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

const client: ApiClient = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.get<T, T>(url, config);
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.post<T, T>(url, data, config);
  },
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.put<T, T>(url, data, config);
  },
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.patch<T, T>(url, data, config);
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.delete<T, T>(url, config);
  },
};

export default client;
