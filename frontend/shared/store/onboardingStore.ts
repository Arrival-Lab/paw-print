import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'pawprint-onboarding' });
const STORAGE_KEY = 'completed-v1';

interface OnboardingState {
  completed: boolean;
  markCompleted: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  completed: storage.getBoolean(STORAGE_KEY) ?? false,
  markCompleted: () => {
    storage.set(STORAGE_KEY, true);
    set({ completed: true });
  },
}));
