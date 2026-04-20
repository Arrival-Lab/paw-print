import axios, { AxiosRequestConfig } from 'axios';
import { Config } from '../../constants';
import * as storage from '../utils/storage';
import type { ApiResponse } from './types';

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const client = axios.create({
  baseURL: Config.apiBaseUrl,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = storage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
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
            resolve(client(originalRequest));
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
        return client(originalRequest);
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

export default client;
