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
  /** 서버에 저장된 사용자 언어 (ko/en/ja). 푸시 등 비동기 발송 시 백엔드가 사용. */
  locale?: string;
  /** 서버에 저장된 IANA 타임존 (예: Asia/Seoul). 케어 리마인더·예방접종 알림 발송 시각 계산 기준. */
  timezone?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** 게스트 모드 — 로그인 없이 비-계정 기능 둘러보기. App Store 5.1.1(v) 대응. */
  isGuest: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setGuest: () => void;
  /** 게스트 모드 해제만 — 로그인 화면 진입 시 호출. clearAuth 와 달리 토큰은 건드리지 않음. */
  exitGuest: () => void;
  clearAuth: () => void;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  // 초기값은 false — 토큰은 SecureStore async 로드 후 hydrateFromStorage() 가 갱신.
  isAuthenticated: false,
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

  exitGuest: () => {
    storage.clearGuestMode();
    set({ isGuest: false });
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

/**
 * JWT 형식만 확인 — 3 part 구조 + 각 part 비어있지 않음. 만료(exp) 는 보지 않음 (refresh 로 갱신).
 * 깨진/잘린 토큰이 storage 에 남아 cold start 마다 401→refresh→실패→clearAuth 반복하는 패턴 차단.
 * (폴드7 사용자에서 보였던 freeze 정황 — 토큰 일부만 저장된 partial state 가 원인 후보.)
 */
function isJwtShape(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

/** initAuthStorage() 가 SecureStore 캐시를 워밍한 직후 호출. 토큰 있으면 인증 상태 활성화. */
export function hydrateAuthFromStorage(): void {
  const token = storage.getAccessToken();
  if (token && !isJwtShape(token)) {
    // 형식 자체가 깨진 토큰 — 다음 호출이 어차피 401, refresh 도 실패. 미리 clear 해서
    // 무한 retry / freeze 방지하고 정상 로그인 화면 진입 유도.
    storage.clearAuth();
    useAuthStore.setState({ isAuthenticated: false });
    return;
  }
  useAuthStore.setState({ isAuthenticated: !!token });
}
