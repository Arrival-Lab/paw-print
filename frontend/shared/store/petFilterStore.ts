import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';

// 마지막으로 선택한 펫을 MMKV 에 영속화 — 앱 재실행 후에도 같은 펫을 본다.
// null = "전체 보기".
const storage = createMMKV({ id: 'pawprint-pet-filter' });
const STORAGE_KEY = 'selectedPetId';

function readPersisted(): number | null {
  const raw = storage.getNumber(STORAGE_KEY);
  return raw === undefined ? null : raw;
}

interface PetFilterState {
  selectedPetId: number | null;
  lastChangedAt: number;
  setSelectedPetId: (id: number | null) => void;
}

export const usePetFilterStore = create<PetFilterState>((set) => ({
  selectedPetId: readPersisted(),
  lastChangedAt: 0,
  setSelectedPetId: (id) => {
    if (id === null) storage.remove(STORAGE_KEY);
    else storage.set(STORAGE_KEY, id);
    set({ selectedPetId: id, lastChangedAt: Date.now() });
  },
}));
