import { Platform } from 'react-native';
import { useCallback, useState } from 'react';
import * as IAP from 'expo-iap';
import { useAuthStore } from '../../auth/store/authStore';
import { subscriptionApi } from '../api/subscriptionApi';
import { Config } from '../../../constants';

const PRODUCT_ID = Platform.OS === 'ios'
  ? Config.appStoreProductId
  : Config.playStoreProductId;

const PLATFORM = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

export function usePurchase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateUser = useAuthStore((s) => s.updateUser);

  const purchase = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await IAP.initConnection();
      const result = await IAP.requestSubscription({ sku: PRODUCT_ID });
      const token = Array.isArray(result) ? result[0]?.purchaseToken : result?.purchaseToken;
      if (!token) throw new Error('구매 토큰을 받지 못했습니다.');

      const status = await subscriptionApi.purchase({
        productId: PRODUCT_ID,
        purchaseToken: token,
        platform: PLATFORM,
      });
      updateUser({ subscriptionType: status.subscriptionType });
      await IAP.finishTransaction({ purchase: Array.isArray(result) ? result[0] : result });
      return status;
    } catch (e: any) {
      const msg = e?.message ?? '구매에 실패했습니다.';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
      await IAP.endConnection().catch(() => {});
    }
  }, [updateUser]);

  return { purchase, loading, error };
}

export function useRestorePurchase() {
  const [loading, setLoading] = useState(false);
  const updateUser = useAuthStore((s) => s.updateUser);

  const restore = useCallback(async () => {
    setLoading(true);
    try {
      await IAP.initConnection();
      const purchases = await IAP.getAvailablePurchases();
      let lastStatus = null;
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
      await IAP.endConnection().catch(() => {});
    }
  }, [updateUser]);

  return { restore, loading };
}
