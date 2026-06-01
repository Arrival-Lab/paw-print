import type { SubscriptionType } from '../features/subscription/api/subscriptionApi';

/**
 * 구독 티어별 한도. 백엔드 `SubscriptionLimits.java` 와 값 동기화.
 * UNLIMITED 는 Number.MAX_SAFE_INTEGER — 비교에서 자연스럽게 통과.
 */
export const UNLIMITED = Number.MAX_SAFE_INTEGER;

export interface SubscriptionLimits {
  maxPets: number;
  maxPhotosPerItem: number;
  maxOcrPerMonth: number;
  maxAiChecksPerMonth: number;
  maxVaccineAlerts: number;
  maxShareMembers: number;
  /** 수치 그래프 노출 가능 일수. UNLIMITED 면 전체. */
  metricsDays: number;
}

const FREE: SubscriptionLimits = {
  maxPets: 3,
  maxPhotosPerItem: 5,
  maxOcrPerMonth: 5,
  maxAiChecksPerMonth: 5,
  maxVaccineAlerts: 3,
  maxShareMembers: 1,
  metricsDays: 30,
};

const FRIEND: SubscriptionLimits = {
  maxPets: 5,
  maxPhotosPerItem: UNLIMITED,
  maxOcrPerMonth: UNLIMITED,
  maxAiChecksPerMonth: UNLIMITED,
  maxVaccineAlerts: UNLIMITED,
  maxShareMembers: 1,
  metricsDays: UNLIMITED,
};

const FAMILY: SubscriptionLimits = {
  maxPets: UNLIMITED,
  maxPhotosPerItem: UNLIMITED,
  maxOcrPerMonth: UNLIMITED,
  maxAiChecksPerMonth: UNLIMITED,
  maxVaccineAlerts: UNLIMITED,
  maxShareMembers: UNLIMITED,
  metricsDays: UNLIMITED,
};

export function getLimits(type: SubscriptionType | undefined): SubscriptionLimits {
  switch (type) {
    case 'FRIEND':
      return FRIEND;
    case 'FAMILY':
    case 'PREMIUM':
      return FAMILY;
    case 'FREE':
    default:
      return FREE;
  }
}

export function isUnlimited(value: number): boolean {
  return value >= UNLIMITED;
}
