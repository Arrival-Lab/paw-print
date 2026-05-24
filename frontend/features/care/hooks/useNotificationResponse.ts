import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { careApi } from '../api/careApi';
import { usePetFilterStore } from '../../../shared/store/petFilterStore';

type CareReminderData = {
  type: 'CARE_REMINDER';
  petId: number | string;
  itemId: number | string;
  date: string;
};

/**
 * 알림 tap / action 버튼 응답 처리.
 * - tap (default) → 펫 선택 + 케어 화면 이동
 * - "✓ 완료" action → setCheck API 호출 + React Query 캐시 invalidate + 펫 선택 + 케어 화면 이동
 * - 콜드 스타트 (앱 killed → 알림 tap 으로 launch) 도 getLastNotificationResponseAsync 로 처리.
 */
export function useNotificationResponse() {
  const qc = useQueryClient();
  useEffect(() => {
    const onResponse = (response: Notifications.NotificationResponse) => handleResponse(response, qc);
    const sub = Notifications.addNotificationResponseReceivedListener(onResponse);
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) onResponse(response);
    });
    return () => sub.remove();
  }, [qc]);
}

async function handleResponse(response: Notifications.NotificationResponse, qc: QueryClient) {
  const raw = response.notification.request.content.data as Partial<CareReminderData> | undefined;
  if (raw?.type !== 'CARE_REMINDER') return;

  const petId = Number(raw.petId);
  const itemId = Number(raw.itemId);
  const date = String(raw.date);
  if (!petId || !itemId || !date) return;

  if (response.actionIdentifier === 'check') {
    try {
      await careApi.setCheck(petId, itemId, { date, count: 1 });
      // useCare.ts 의 invalidateCare 와 동일 패턴 — 펫의 케어 데이터·홈 위젯 모두 새로고침.
      qc.invalidateQueries({ queryKey: ['care', 'items', petId] });
      qc.invalidateQueries({ queryKey: ['care', 'day', petId] });
      qc.invalidateQueries({ queryKey: ['care', 'home'] });
    } catch (e) {
      if (__DEV__) console.warn('[care] auto check from notification failed', e);
    }
  }

  // 알림이 가리키는 펫을 전역 store 에 set — PetSelector 가 자동 구독해서 chip UI 업데이트.
  usePetFilterStore.getState().setSelectedPetId(petId);

  router.push({
    pathname: '/(tabs)/daily',
    params: { tab: 'daily-check' },
  });
}
