import { Platform } from 'react-native';
import { useCallback, useRef, useState } from 'react';
import {
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

// 네이티브 IAP 에러를 한국어로 매핑. unknown 은 원문 그대로 노출 (디버깅에 도움).
function translateIAPError(raw?: string | null): string {
  const msg = raw ?? '';
  if (/billing client not ready|service.*disconnected|service.*unavailable/i.test(msg)) {
    return '스토어 연결이 끊겼어요. 잠시 후 다시 시도하거나, 앱을 재실행해주세요.';
  }
  if (/user (canceled|cancelled)|cancell?ed by user/i.test(msg)) {
    return '구매가 취소됐어요.';
  }
  if (/item already owned|already.*subscribed/i.test(msg)) {
    return '이미 구독 중이에요. 아래 "구매 복원" 을 눌러주세요.';
  }
  if (/network|timeout|timed out/i.test(msg)) {
    return '네트워크 오류예요. Wi-Fi 또는 모바일 데이터를 확인해주세요.';
  }
  if (/item.*unavailable|product.*not.*found/i.test(msg)) {
    return '현재 이 상품을 구매할 수 없어요. 잠시 후 다시 시도해주세요.';
  }
  return msg || '구매에 실패했어요. 잠시 후 다시 시도해주세요.';
}

type PendingPurchase = {
  productId: string;
  resolve: (status: SubscriptionStatus) => void;
  reject: (err: Error) => void;
};

/**
 * IAP 연결·구매·복원을 한 hook 으로 묶음.
 *
 * 같은 화면에 두 hook (purchase / restore) 이 각각 useIAP + initConnection/endConnection 을
 * 따로 관리하면 endConnection 이 싱글톤 네이티브 클라이언트를 죽여서 다음 구매가
 * "Billing client not ready" 로 실패함 (Android). 하나의 useIAP 인스턴스로 통합해서 해결.
 *
 * 네이티브 빌링 클라이언트가 OS 의 백그라운드 종료 등으로 끊겼을 때, useIAP 의 React state
 * `connected` 는 갱신이 늦거나 안 됨. 매 구매/복원 직전에 idempotent 한 initConnection 으로
 * 강제 reconnect 시도.
 */
export function useIAPController() {
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
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
      setPurchasing(false);
    }
  }, [updateUser]);

  const settleError = useCallback((err: { message?: string; code?: string }) => {
    console.log('[IAP] onPurchaseError', err);
    const ctx = pendingRef.current;
    if (!ctx) return;
    const friendly = translateIAPError(err?.message);
    setError(friendly);
    ctx.reject(new Error(friendly));
    pendingRef.current = null;
    setPurchasing(false);
  }, []);

  const { connected, fetchProducts, requestPurchase } = useIAP({
    onPurchaseSuccess: settleSuccess,
    onPurchaseError: settleError,
  });

  // initConnection 은 expo-iap 내부에서 idempotent — 이미 연결돼 있으면 빠르게 반환.
  // 매 호출 직전 강제 ensure 해서 native disconnect 케이스 복구.
  const ensureNativeReady = useCallback(async () => {
    try {
      await initConnection();
    } catch (e: any) {
      console.log('[IAP] initConnection (idempotent):', e?.message);
    }
  }, []);

  const purchase = useCallback((plan: Plan): Promise<SubscriptionStatus> => {
    return new Promise<SubscriptionStatus>(async (resolve, reject) => {
      const productId = productIdFor(plan);
      console.log('[IAP] purchase start', { productId, connected });
      if (pendingRef.current) {
        reject(new Error('이전 구매 처리가 끝나지 않았어요. 잠시 후 다시 시도해주세요.'));
        return;
      }
      try {
        setPurchasing(true);
        setError(null);

        await ensureNativeReady();

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
          setPurchasing(false);
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
        setPurchasing(false);
        const friendly = translateIAPError(e?.message);
        setError(friendly);
        reject(e instanceof Error ? new Error(friendly) : new Error(friendly));
      }
    });
  }, [connected, ensureNativeReady, fetchProducts, requestPurchase, updateUser]);

  const restore = useCallback(async (): Promise<SubscriptionStatus | null> => {
    setRestoring(true);
    try {
      await ensureNativeReady();
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
      setRestoring(false);
      // ❌ endConnection() 호출 안 함 — 싱글톤 네이티브 클라이언트를 죽이면
      //    뒤따르는 purchase 가 "Billing client not ready" 로 실패함. useIAP 의 unmount 정리에 위임.
    }
  }, [ensureNativeReady, updateUser]);

  return { connected, purchase, restore, purchasing, restoring, error };
}

// ⚠ 기존 usePurchase/useRestorePurchase 는 의도적으로 제거. 한 화면에서 둘을 동시에 호출하면
//   useIAP 인스턴스가 2개 생기고, 한쪽이 endConnection 을 부르면 다른 쪽이 깨지는 구조 결함이
//   있었음 (Android 에서 "Billing client not ready"). 새 호출부는 useIAPController 하나만 사용.
