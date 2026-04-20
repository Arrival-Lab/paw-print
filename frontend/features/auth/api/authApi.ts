import client from '../../../shared/api/client';
import type { User } from '../store/authStore';

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const authApi = {
  login: (body: LoginRequest) => client.post<AuthTokens>('/api/auth/login', body),
  me: () => client.get<User>('/api/auth/me'),
  logout: () => client.post('/api/auth/logout'),
};
