import { create } from 'zustand';

interface GlossaryState {
  visible: boolean;
  initialQuery: string;
  open: (term?: string) => void;
  close: () => void;
}

export const useGlossaryStore = create<GlossaryState>((set) => ({
  visible: false,
  initialQuery: '',
  open: (term) => set({ visible: true, initialQuery: term ?? '' }),
  close: () => set({ visible: false, initialQuery: '' }),
}));
