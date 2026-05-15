import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';

export type ThemeMode = 'system' | 'light' | 'dark';

const storage = createMMKV({ id: 'pawprint-theme' });
const STORAGE_KEY = 'mode';

function readPersisted(): ThemeMode {
  const raw = storage.getString(STORAGE_KEY);
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  return 'system';
}

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: readPersisted(),
  setMode: (mode) => {
    storage.set(STORAGE_KEY, mode);
    set({ mode });
  },
}));
