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
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!storage.getAccessToken(),

  setAuth: (user, accessToken, refreshToken) => {
    storage.setAccessToken(accessToken);
    storage.setRefreshToken(refreshToken);
    set({ user, isAuthenticated: true });
  },

  clearAuth: () => {
    storage.clearAuth();
    set({ user: null, isAuthenticated: false });
  },

  updateUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : partial as User,
    })),
}));
