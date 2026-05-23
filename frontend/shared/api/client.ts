import axios, { AxiosRequestConfig } from 'axios';
import { Config } from '../../constants';
import * as storage from '../utils/storage';
import type { ApiResponse } from './types';

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

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
        storage.clearAuth();
        // 동적 import로 순환 의존성 방지
        const { router } = await import('expo-router');
        router.replace('/(auth)/login');
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
type ApiClient = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) => Promise<T>;
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>;
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>;
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>;
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => Promise<T>;
};

const client: ApiClient = {
  get: <T,>(url: string, config?: AxiosRequestConfig) => axiosInstance.get<T, T>(url, config),
  post: <T,>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.post<T, T>(url, data, config),
  put: <T,>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.put<T, T>(url, data, config),
  patch: <T,>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.patch<T, T>(url, data, config),
  delete: <T,>(url: string, config?: AxiosRequestConfig) => axiosInstance.delete<T, T>(url, config),
};

export default client;
