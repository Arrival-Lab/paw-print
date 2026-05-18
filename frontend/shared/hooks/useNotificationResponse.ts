import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { careApi } from '../../features/care/api/careApi';

type CareReminderData = {
  type: 'CARE_REMINDER';
  petId: number | string;
  itemId: number | string;
  date: string;
};

/**
 * 알림 tap / action 버튼 응답 처리.
 * - tap (default) → 케어 화면 이동
 * - "✓ 완료" action → setCheck API 호출 후 케어 화면 이동
 * - 콜드 스타트 (앱 killed → 알림 tap 으로 launch) 도 getLastNotificationResponseAsync 로 처리.
 */
export function useNotificationResponse() {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });
    return () => sub.remove();
  }, []);
}

async function handleResponse(response: Notifications.NotificationResponse) {
  const raw = response.notification.request.content.data as Partial<CareReminderData> | undefined;
  if (raw?.type !== 'CARE_REMINDER') return;

  const petId = Number(raw.petId);
  const itemId = Number(raw.itemId);
  const date = String(raw.date);
  if (!petId || !itemId || !date) return;

  if (response.actionIdentifier === 'check') {
    try {
      await careApi.setCheck(petId, itemId, { date, count: 1 });
    } catch (e) {
      if (__DEV__) console.warn('[care] auto check from notification failed', e);
    }
  }

  router.push({
    pathname: '/(tabs)/records',
    params: { tab: 'daily' },
  });
}
