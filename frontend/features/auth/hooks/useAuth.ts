import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/authApi';

export const useAuth = () => {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  const login = async (email: string, password: string) => {
    const data = await authApi.login({ email, password }) as any;
    setAuth(data.user, data.accessToken, data.refreshToken);
  };

  const logout = async () => {
    await authApi.logout().catch(() => {});
    clearAuth();
  };

  return { user, isAuthenticated, login, logout };
};
