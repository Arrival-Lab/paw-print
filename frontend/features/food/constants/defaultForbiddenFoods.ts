import i18n from '../../../shared/i18n';
import type { Pet } from '../../pet/api/petApi';

type Species = Pet['species'];

/**
 * 종별 공통 금지 음식 — 텍스트는 i18n `food.forbidden.{species}` (returnObjects).
 * 새 펫의 식이 정보 처음 진입 시 prefill·가이드 노출용. 사용자가 추가/제거 가능.
 * 출처: 한국 동물병원 일반 권고 + AAFCO/ASPCA 가이드라인.
 */
export function getForbiddenFoods(species: Species): string[] {
  const list = i18n.t(`food.forbidden.${species}`, { returnObjects: true }) as unknown;
  return Array.isArray(list) ? (list as string[]) : [];
}
