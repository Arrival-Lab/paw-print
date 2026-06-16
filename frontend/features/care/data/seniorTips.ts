import i18n from '../../../shared/i18n';
import type { Pet } from '../../pet/api/petApi';
import type { LifeStage } from '../../pet/utils/lifeStage';

export interface SeniorTip {
  title: string;
  body: string;
  /** 권장 검진 빈도 — "6개월 1회" 등 */
  checkupCadence?: string;
  /** 보호자가 집에서 체크할 항목 */
  watchFor: string[];
}

// 종/단계별 시니어 팁 존재 여부. 실제 텍스트는 i18n `care.senior.{species}.{stage}` 에서.
const AVAILABLE: Record<Pet['species'], LifeStage[]> = {
  DOG: ['SENIOR', 'GERIATRIC'],
  CAT: ['SENIOR', 'GERIATRIC'],
  BIRD: ['SENIOR'],
  REPTILE: ['SENIOR'],
  SMALL_ANIMAL: ['SENIOR'],
  OTHER: ['SENIOR'],
};

export function getSeniorTip(pet: Pet, stage: LifeStage): SeniorTip | null {
  const avail = AVAILABLE[pet.species];
  if (!avail) return null;
  // GERIATRIC 데이터가 없으면 SENIOR 폴백
  const resolved: LifeStage | null = avail.includes(stage)
    ? stage
    : avail.includes('SENIOR')
      ? 'SENIOR'
      : null;
  if (!resolved) return null;
  const tip = i18n.t(`care.senior.${pet.species}.${resolved}`, { returnObjects: true }) as unknown;
  if (!tip || typeof tip !== 'object') return null;
  return tip as SeniorTip;
}
