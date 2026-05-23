import { create } from 'zustand';
import * as storage from '../../../shared/utils/storage';
import type { SubscriptionType } from '../../subscription/api/subscriptionApi';

export interface User {
  id: number;
  email: string;
  name: string;
  nickname: string | null;
  profileImage: string | null;
  subscriptionType: SubscriptionType;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** 게스트 모드 — 로그인 없이 비-계정 기능 둘러보기. App Store 5.1.1(v) 대응. */
  isGuest: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setGuest: () => void;
  clearAuth: () => void;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!storage.getAccessToken(),
  isGuest: storage.isGuestMode(),

  setAuth: (user, accessToken, refreshToken) => {
    storage.setAccessToken(accessToken);
    storage.setRefreshToken(refreshToken);
    storage.clearGuestMode();
    set({ user, isAuthenticated: true, isGuest: false });
  },

  setGuest: () => {
    storage.setGuestMode(true);
    set({ isGuest: true, user: null, isAuthenticated: false });
  },

  clearAuth: () => {
    storage.clearAuth();
    set({ user: null, isAuthenticated: false, isGuest: false });
  },

  updateUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : partial as User,
    })),
}));
