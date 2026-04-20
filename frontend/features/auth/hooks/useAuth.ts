import { useCallback } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/authApi';
import { storage } from '../../../shared/utils/storage';

export const useAuth = () => {
  const { clearAuth, updateUser } = useAuthStore();

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {}
    storage.clearAuth();
    clearAuth();
    router.replace('/(auth)/login');
  }, [clearAuth]);

  const refreshUser = useCallback(async () => {
    try {
      const user = await authApi.me();
      updateUser(user as any);
    } catch {
      storage.clearAuth();
      clearAuth();
      router.replace('/(auth)/login');
    }
  }, [clearAuth, updateUser]);

  return { logout, refreshUser };
};
