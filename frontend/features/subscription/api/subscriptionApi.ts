import client from '../../../shared/api/client';

export type Platform = 'IOS' | 'ANDROID';
export type SubscriptionType = 'FREE' | 'FRIEND' | 'FAMILY' | 'PREMIUM';

/**
 * paid 티어 (FREE 가 아닌 모든 것).
 * 백엔드 SubscriptionType.isPaid() 와 일치 — FRIEND/FAMILY/PREMIUM 모두 unlocked.
 */
export function isPaidTier(type: SubscriptionType | undefined | null): boolean {
  return type != null && type !== 'FREE';
}

export interface PurchaseRequest {
  productId: string;
  purchaseToken: string;
  platform: Platform;
}

export interface SubscriptionStatus {
  subscriptionType: SubscriptionType;
  expiresAt: string | null;
  isActive: boolean;
}

export const subscriptionApi = {
  purchase: (data: PurchaseRequest) =>
    client.post<SubscriptionStatus>('/api/subscriptions/purchase', data),

  restore: (data: PurchaseRequest) =>
    client.post<SubscriptionStatus>('/api/subscriptions/restore', data),

  getStatus: () =>
    client.get<SubscriptionStatus>('/api/subscriptions/status'),
};
