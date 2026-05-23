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
import { subscriptionApi, isPaidTier, type SubscriptionStatus } from '../api/subscriptionApi';
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
    console.log('[IAP] onPurchaseSuccess', { productId: purchase.productId, hasToken: !!purchase.purchaseToken });
    const ctx = pendingRef.current;
    if (!ctx) {
      console.log('[IAP] no pending — finishing orphan transaction');
      await finishTransactionTopLevel({ purchase, isConsumable: false }).catch((e) => console.log('[IAP] finish orphan failed', e?.message));
      return;
    }
    if (ctx.productId !== purchase.productId) {
      console.log('[IAP] productId mismatch — ignoring', ctx.productId, purchase.productId);
      return;
    }
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
      console.log('[IAP] purchase backend/finish failed', e?.message);
      ctx.reject(e instanceof Error ? e : new Error(String(e?.message ?? e)));
    } finally {
      pendingRef.current = null;
      setLoading(false);
    }
  }, [updateUser]);

  const settleError = useCallback((err: { message?: string; code?: string }) => {
    console.log('[IAP] onPurchaseError', err);
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
      console.log('[IAP] purchase start', { productId, connected });
      if (pendingRef.current) {
        reject(new Error('이전 구매 처리가 끝나지 않았어요. 잠시 후 다시 시도해주세요.'));
        return;
      }
      try {
        setLoading(true);
        setError(null);
        if (!connected) throw new Error('스토어 연결 대기 중이에요. 잠시 후 다시 시도해주세요.');

        const stale = await getAvailablePurchases().catch((e) => {
          console.log('[IAP] getAvailablePurchases failed', e?.message);
          return [] as Purchase[];
        });
        console.log('[IAP] stale transactions:', stale.length);
        let staleActivated: SubscriptionStatus | null = null;
        for (const p of stale) {
          const token = p.purchaseToken;
          if (token) {
            try {
              staleActivated = await subscriptionApi.restore({
                productId: p.productId,
                purchaseToken: token,
                platform: PLATFORM,
              });
              console.log('[IAP] stale restored to backend', p.productId);
            } catch (e: any) {
              console.log('[IAP] stale restore failed', e?.message);
            }
          }
          await finishTransactionTopLevel({ purchase: p, isConsumable: false }).catch((e) =>
            console.log('[IAP] finish stale failed', e?.message)
          );
        }
        // restore 응답이 paid 일 때만 — 다른 user 에 이미 묶인 transaction 은 백엔드가 FREE 로 반환함.
        if (staleActivated && isPaidTier(staleActivated.subscriptionType)) {
          updateUser({ subscriptionType: staleActivated.subscriptionType });
          setLoading(false);
          resolve(staleActivated);
          return;
        }

        await fetchProducts({ skus: [productId], type: 'subs' });
        pendingRef.current = { productId, resolve, reject };
        console.log('[IAP] requesting purchase');

        await requestPurchase({
          request: Platform.OS === 'ios'
            ? { ios: { sku: productId } }
            : { android: { skus: [productId] } },
          type: 'subs',
        });
        console.log('[IAP] requestPurchase returned — waiting for listener');
      } catch (e: any) {
        console.log('[IAP] purchase setup failed', e?.message);
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
