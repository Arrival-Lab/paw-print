import i18n from '../../../shared/i18n';
import type { Pet } from '../api/petApi';

export type LifeStage = 'JUNIOR' | 'ADULT' | 'SENIOR' | 'GERIATRIC';

/**
 * 종별 시니어 진입 연령. 보편적인 동물병원 가이드라인 기준 — 정확한 검진은 수의사 판단.
 *  DOG: 7세 시니어, 11세 노령 (소형견 더 늦게 들어가지만 보호자 케어 환기 목적)
 *  CAT: 7세 시니어, 12세 노령
 *  BIRD/REPTILE/SMALL_ANIMAL: 데이터 다양해서 종합 평균 5세 시니어
 */
const SENIOR_THRESHOLDS: Record<Pet['species'], { senior: number; geriatric: number }> = {
  DOG: { senior: 7, geriatric: 11 },
  CAT: { senior: 7, geriatric: 12 },
  BIRD: { senior: 5, geriatric: 10 },
  REPTILE: { senior: 5, geriatric: 12 },
  SMALL_ANIMAL: { senior: 3, geriatric: 6 },
  OTHER: { senior: 7, geriatric: 11 },
};

export function getAgeInYears(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  const ms = now.getTime() - birth.getTime();
  return ms / (1000 * 60 * 60 * 24 * 365.25);
}

export function getLifeStage(pet: Pet): LifeStage | null {
  const age = getAgeInYears(pet.birthDate);
  if (age === null) return null;
  const t = SENIOR_THRESHOLDS[pet.species];
  if (age < 1) return 'JUNIOR';
  if (age < t.senior) return 'ADULT';
  if (age < t.geriatric) return 'SENIOR';
  return 'GERIATRIC';
}

export function isSeniorPet(pet: Pet): boolean {
  const stage = getLifeStage(pet);
  return stage === 'SENIOR' || stage === 'GERIATRIC';
}

export function ageLabel(birthDate: string | null): string | null {
  const age = getAgeInYears(birthDate);
  if (age === null) return null;
  if (age < 1) {
    const months = Math.floor(age * 12);
    return i18n.t('home.age.months', { count: months });
  }
  return i18n.t('pet.ageYears', { count: Math.floor(age) });
}
