import { create } from 'zustand';

interface UiState {
  isPremiumModalVisible: boolean;
  premiumModalMessage: string;
  showPremiumModal: (message?: string) => void;
  hidePremiumModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isPremiumModalVisible: false,
  premiumModalMessage: '',

  showPremiumModal: (message) =>
    set({
      isPremiumModalVisible: true,
      premiumModalMessage: message ?? '프리미엄 구독이 필요한 기능입니다.',
    }),

  hidePremiumModal: () =>
    set({ isPremiumModalVisible: false, premiumModalMessage: '' }),
}));
