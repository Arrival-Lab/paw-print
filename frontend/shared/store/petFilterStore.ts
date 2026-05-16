import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'pawprint-pet-filter' });
const STORAGE_KEY = 'last-pet-id';

function readPersisted(): number | null {
  const raw = storage.getNumber(STORAGE_KEY);
  return typeof raw === 'number' ? raw : null;
}

interface PetFilterState {
  selectedPetId: number | null;
  setSelectedPetId: (id: number | null) => void;
}

export const usePetFilterStore = create<PetFilterState>((set) => ({
  selectedPetId: readPersisted(),
  setSelectedPetId: (id) => {
    if (id === null) storage.remove(STORAGE_KEY);
    else storage.set(STORAGE_KEY, id);
    set({ selectedPetId: id });
  },
}));
