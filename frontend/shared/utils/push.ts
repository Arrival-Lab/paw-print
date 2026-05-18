import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import messaging from '@react-native-firebase/messaging';
import { authApi } from '../../features/auth/api/authApi';

let registeredToken: string | null = null;

/**
 * 푸시 알림 권한 요청 + FCM 토큰 발급 + 백엔드 등록.
 * - 권한 다이얼로그: expo-notifications 가 담당 (iOS APNs / Android POST_NOTIFICATIONS)
 * - 토큰 발급: @react-native-firebase/messaging — iOS 의 APNs raw token 을
 *   Firebase 가 내부에서 FCM registration token 으로 변환해서 반환. 백엔드 FcmService
 *   가 그대로 FirebaseMessaging.send() 호출 가능.
 * - 알림 표시 / 채널 / tap handling: expo-notifications 가 담당.
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

    if (Platform.OS === 'ios') {
      await messaging().registerDeviceForRemoteMessages();
    }

    const token = await messaging().getToken();
    if (!token) return;
    if (token === registeredToken) return;

    await authApi.updateFcmToken(token);
    registeredToken = token;
  } catch (e) {
    if (__DEV__) console.warn('[push] register failed', e);
  }
}
