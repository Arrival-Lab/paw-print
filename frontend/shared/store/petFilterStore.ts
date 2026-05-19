import { create } from 'zustand';

// 펫 필터는 in-memory only. 앱 재실행 시 항상 "전체 보기" (null) 로 시작.
// null = "전체 보기".

interface PetFilterState {
  selectedPetId: number | null;
  lastChangedAt: number;
  setSelectedPetId: (id: number | null) => void;
}

export const usePetFilterStore = create<PetFilterState>((set) => ({
  selectedPetId: null,
  lastChangedAt: 0,
  setSelectedPetId: (id) => {
    set({ selectedPetId: id, lastChangedAt: Date.now() });
  },
}));
