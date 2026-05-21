import type { Pet } from '../api/petApi';

type Species = Pet['species'];

/** 펫 등록·수정 폼의 품종 입력 placeholder — species 별 흔한 품종 예시. */
export const BREED_PLACEHOLDER: Record<Species, string> = {
  DOG: '예: 말티즈, 푸들, 시바, 믹스',
  CAT: '예: 코리안 숏헤어, 러시안 블루, 페르시안',
  BIRD: '예: 사랑앵무, 모란앵무, 왕관앵무',
  REPTILE: '예: 거북이, 도마뱀, 게코',
  SMALL_ANIMAL: '예: 햄스터, 토끼, 고슴도치',
  OTHER: '품종 입력 (선택)',
};
