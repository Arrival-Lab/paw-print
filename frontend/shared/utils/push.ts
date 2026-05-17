import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { authApi } from '../../features/auth/api/authApi';

let registeredToken: string | null = null;
let unsubscribeOnRefresh: (() => void) | null = null;

/**
 * 권한 요청 → FCM 토큰 발급 → 백엔드 등록.
 * 로그인 직후/앱 시작 시 호출. 중복 호출 안전 (같은 토큰이면 skip).
 */
export async function registerPushToken(): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (!enabled) return;
      await messaging().registerDeviceForRemoteMessages();
    }

    const token = await messaging().getToken();
    if (!token) return;
    if (token === registeredToken) return;

    await authApi.updateFcmToken(token);
    registeredToken = token;

    if (!unsubscribeOnRefresh) {
      unsubscribeOnRefresh = messaging().onTokenRefresh(async (next) => {
        try {
          await authApi.updateFcmToken(next);
          registeredToken = next;
        } catch {
          // 다음 앱 진입 시 재시도됨
        }
      });
    }
  } catch (e) {
    if (__DEV__) console.warn('[push] register failed', e);
  }
}
