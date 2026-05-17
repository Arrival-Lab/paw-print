import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { authApi } from '../../features/auth/api/authApi';

let registeredToken: string | null = null;

/**
 * 푸시 알림 권한 요청 + 디바이스 푸시 토큰 발급 + 백엔드 등록.
 * dearmi 와 동일 패턴 — expo-notifications 만 사용 (RNFirebase 불필요).
 * - Android: getDevicePushTokenAsync 가 FCM token 반환 → 백엔드 FCM send 그대로 동작
 * - iOS: APNs raw token 반환 (FCM send 호환 안 됨, Firebase Console 의 APNs key 셋업 + iOS Firebase SDK 통합 필요)
 */
export async function registerPushToken(): Promise<void> {
  try {
    if (!Device.isDevice) return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: '기본 알림',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F4A8B8',
      });
    }

    const tokenData = await Notifications.getDevicePushTokenAsync();
    const token = tokenData.data;
    if (!token) return;
    if (token === registeredToken) return;

    await authApi.updateFcmToken(token);
    registeredToken = token;
  } catch (e) {
    if (__DEV__) console.warn('[push] register failed', e);
  }
}
