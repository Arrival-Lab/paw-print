import { Platform } from 'react-native';
import { useCallback, useRef, useState } from 'react';
import {
  endConnection,
  fetchProducts as fetchProductsTopLevel,
  finishTransaction as finishTransactionTopLevel,
  getAvailablePurchases,
  initConnection,
  useIAP,
  type Purchase,
} from 'expo-iap';
import { useAuthStore } from '../../auth/store/authStore';
import { subscriptionApi, type SubscriptionStatus } from '../api/subscriptionApi';
import { Config } from '../../../constants';

export type Plan = 'friendMonthly' | 'familyMonthly' | 'familyYearly';

const PLATFORM = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

function productIdFor(plan: Plan): string {
  if (Platform.OS === 'ios') {
    switch (plan) {
      case 'friendMonthly': return Config.appStoreFriendMonthly;
      case 'familyMonthly': return Config.appStoreFamilyMonthly;
      case 'familyYearly': return Config.appStoreFamilyYearly;
    }
  }
  switch (plan) {
    case 'friendMonthly': return Config.playStoreFriendMonthly;
    case 'familyMonthly': return Config.playStoreFamilyMonthly;
    case 'familyYearly': return Config.playStoreFamilyYearly;
  }
}

type PendingPurchase = {
  productId: string;
  resolve: (status: SubscriptionStatus) => void;
  reject: (err: Error) => void;
};

export function usePurchase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateUser = useAuthStore((s) => s.updateUser);
  const pendingRef = useRef<PendingPurchase | null>(null);

  const settleSuccess = useCallback(async (purchase: Purchase) => {
    const ctx = pendingRef.current;
    if (!ctx) return;
    // 다른 hook 인스턴스로 들어온 결제 이벤트 — 무시
    if (ctx.productId !== purchase.productId) return;
    try {
      const token = purchase.purchaseToken;
      if (!token) throw new Error('구매 토큰을 받지 못했습니다.');
      const status = await subscriptionApi.purchase({
        productId: ctx.productId,
        purchaseToken: token,
        platform: PLATFORM,
      });
      updateUser({ subscriptionType: status.subscriptionType });
      await finishTransactionTopLevel({ purchase, isConsumable: false });
      ctx.resolve(status);
    } catch (e: any) {
      ctx.reject(e instanceof Error ? e : new Error(String(e?.message ?? e)));
    } finally {
      pendingRef.current = null;
      setLoading(false);
    }
  }, [updateUser]);

  const settleError = useCallback((err: { message?: string; code?: string }) => {
    const ctx = pendingRef.current;
    if (!ctx) return;
    const msg = err?.message ?? '구매에 실패했습니다.';
    setError(msg);
    ctx.reject(new Error(msg));
    pendingRef.current = null;
    setLoading(false);
  }, []);

  const { connected, fetchProducts, requestPurchase } = useIAP({
    onPurchaseSuccess: settleSuccess,
    onPurchaseError: settleError,
  });

  const purchase = useCallback((plan: Plan): Promise<SubscriptionStatus> => {
    return new Promise<SubscriptionStatus>(async (resolve, reject) => {
      const productId = productIdFor(plan);
      if (pendingRef.current) {
        reject(new Error('이전 구매 처리가 끝나지 않았어요. 잠시 후 다시 시도해주세요.'));
        return;
      }
      try {
        setLoading(true);
        setError(null);
        if (!connected) throw new Error('스토어 연결 대기 중이에요. 잠시 후 다시 시도해주세요.');

        await fetchProducts({ skus: [productId], type: 'subs' });
        pendingRef.current = { productId, resolve, reject };

        await requestPurchase({
          request: Platform.OS === 'ios'
            ? { ios: { sku: productId } }
            : { android: { skus: [productId] } },
          type: 'subs',
        });
      } catch (e: any) {
        pendingRef.current = null;
        setLoading(false);
        const msg = e?.message ?? '구매에 실패했습니다.';
        setError(msg);
        reject(e instanceof Error ? e : new Error(msg));
      }
    });
  }, [connected, fetchProducts, requestPurchase]);

  return { purchase, loading, error };
}

export function useRestorePurchase() {
  const [loading, setLoading] = useState(false);
  const updateUser = useAuthStore((s) => s.updateUser);

  const restore = useCallback(async () => {
    setLoading(true);
    try {
      await initConnection();
      const purchases = await getAvailablePurchases();
      let lastStatus: SubscriptionStatus | null = null;
      for (const p of purchases) {
        const token = p.purchaseToken;
        if (!token) continue;
        try {
          lastStatus = await subscriptionApi.restore({
            productId: p.productId,
            purchaseToken: token,
            platform: PLATFORM,
          });
        } catch {}
      }
      if (lastStatus) updateUser({ subscriptionType: lastStatus.subscriptionType });
      return lastStatus;
    } finally {
      setLoading(false);
      await endConnection().catch(() => {});
    }
  }, [updateUser]);

  return { restore, loading };
}
