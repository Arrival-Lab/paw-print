import type { Pet } from '../api/petApi';

type Species = Pet['species'];

/** 펫 등록·수정 폼의 품종 입력 placeholder i18n 키 — species 별 흔한 품종 예시. 렌더에서 t() 로 변환. */
export const BREED_PLACEHOLDER_KEY: Record<Species, string> = {
  DOG: 'pet.breedHint.DOG',
  CAT: 'pet.breedHint.CAT',
  BIRD: 'pet.breedHint.BIRD',
  REPTILE: 'pet.breedHint.REPTILE',
  SMALL_ANIMAL: 'pet.breedHint.SMALL_ANIMAL',
  OTHER: 'pet.breedHint.OTHER',
};
