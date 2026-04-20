import client from '../../../shared/api/client';

export type Platform = 'IOS' | 'ANDROID';
export type SubscriptionType = 'FREE' | 'PREMIUM';

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
