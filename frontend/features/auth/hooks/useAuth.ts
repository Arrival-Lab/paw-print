import { useCallback } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/authApi';
import { clearAuth as storageClearAuth } from '../../../shared/utils/storage';

export const useAuth = () => {
  const { clearAuth, updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {}
    storageClearAuth();
    clearAuth();
    // 이전 계정의 React Query 캐시(펫·일정·기록 등) 다음 로그인 사용자에게 누수되지 않도록 비움.
    queryClient.clear();
    router.replace('/(auth)/login');
  }, [clearAuth, queryClient]);

  const refreshUser = useCallback(async () => {
    try {
      const user = await authApi.me();
      updateUser(user as any);
    } catch {
      storageClearAuth();
      clearAuth();
      router.replace('/(auth)/login');
    }
  }, [clearAuth, updateUser]);

  return { logout, refreshUser };
};
