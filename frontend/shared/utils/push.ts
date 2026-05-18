import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { authApi } from '../../features/auth/api/authApi';

let registeredToken: string | null = null;

/**
 * 권한 요청 + Expo Push Token 발급 + 백엔드 등록.
 * 토큰 형식: `ExponentPushToken[xxxxxxxxxxxxxxxxxxx]`
 * 백엔드는 이 토큰을 Expo Push API (https://exp.host/--/api/v2/push/send) 에 그대로 POST.
 * iOS/Android 모두 동일 형식 — Expo 가 내부적으로 APNs/FCM 분배.
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

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      if (__DEV__) console.warn('[push] projectId not found in expoConfig');
      return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;
    if (!token) return;
    if (token === registeredToken) return;

    await authApi.updateFcmToken(token);
    registeredToken = token;
  } catch (e) {
    if (__DEV__) console.warn('[push] register failed', e);
  }
}
