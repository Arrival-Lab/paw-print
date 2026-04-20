import client from '../../../shared/api/client';
import { storage } from '../../../shared/utils/storage';
import type { User } from '../store/authStore';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const authApi = {
  googleLogin: (idToken: string) =>
    client.post<AuthResponse>('/api/auth/google', { idToken }),

  appleLogin: (identityToken: string) =>
    client.post<AuthResponse>('/api/auth/apple', { identityToken }),

  refresh: (refreshToken: string) =>
    client.post<AuthResponse>('/api/auth/refresh', { refreshToken }),

  logout: () => client.post<void>('/api/auth/logout'),

  me: () => client.get<User>('/api/auth/me'),

  updateFcmToken: (fcmToken: string) =>
    client.patch<void>('/api/auth/fcm-token', { fcmToken }),

  saveTokens: (accessToken: string, refreshToken: string) => {
    storage.setAccessToken(accessToken);
    storage.setRefreshToken(refreshToken);
  },
};
