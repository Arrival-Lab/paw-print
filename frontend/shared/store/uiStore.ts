import { create } from 'zustand';
import { hasSeenPaywall, markPaywallSeen } from '../utils/storage';
import i18n from '../i18n';

interface UiState {
  isPremiumModalVisible: boolean;
  premiumModalMessage: string;
  /** 이 메시지를 사용자가 처음 보는 경우 true — 부드러운 톤으로 표시. */
  premiumModalFirstHit: boolean;
  showPremiumModal: (message?: string) => void;
  hidePremiumModal: () => void;

  /** 게스트가 계정 기능 탭 시 노출되는 로그인 권유 시트. */
  isLoginPromptVisible: boolean;
  loginPromptMessage: string;
  showLoginPrompt: (message?: string) => void;
  hideLoginPrompt: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isPremiumModalVisible: false,
  premiumModalMessage: '',
  premiumModalFirstHit: false,

  showPremiumModal: (message) => {
    const m = message ?? i18n.t('premium.requiredDefault');
    const firstHit = !hasSeenPaywall(m);
    if (firstHit) markPaywallSeen(m);
    set({
      isPremiumModalVisible: true,
      premiumModalMessage: m,
      premiumModalFirstHit: firstHit,
    });
  },

  hidePremiumModal: () =>
    set({ isPremiumModalVisible: false, premiumModalMessage: '', premiumModalFirstHit: false }),

  isLoginPromptVisible: false,
  loginPromptMessage: '',
  showLoginPrompt: (message) =>
    set({
      isLoginPromptVisible: true,
      loginPromptMessage: message ?? i18n.t('auth.loginRequired'),
    }),
  hideLoginPrompt: () => set({ isLoginPromptVisible: false, loginPromptMessage: '' }),
}));
