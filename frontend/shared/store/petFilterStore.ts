import { create } from 'zustand';

// 펫 필터는 세션 메모리에만 보관 — 매 앱 실행 시 기본값은 "전체 보기" (null).
interface PetFilterState {
  selectedPetId: number | null;
  setSelectedPetId: (id: number | null) => void;
}

export const usePetFilterStore = create<PetFilterState>((set) => ({
  selectedPetId: null,
  setSelectedPetId: (id) => set({ selectedPetId: id }),
}));
