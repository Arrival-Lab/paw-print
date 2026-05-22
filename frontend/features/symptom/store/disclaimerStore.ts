import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'pawprint-storage' });
const KEY = 'symptom_check_disclaimer_v1';

interface State {
  accepted: boolean;
  accept: () => void;
}

export const useDisclaimerStore = create<State>((set) => ({
  accepted: storage.getBoolean(KEY) ?? false,
  accept: () => {
    storage.set(KEY, true);
    set({ accepted: true });
  },
}));
