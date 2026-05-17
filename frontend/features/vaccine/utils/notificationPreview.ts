import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';

/**
 * 5초 뒤 로컬 알림 1개 예약. 백신 알림이 실제로 어떻게 보이는지 사용자가 미리 검증할 수 있도록.
 * 권한 거부 시 안내 Alert. iOS/Android 둘 다 동작.
 */
export async function scheduleVaccineNotificationPreview(vaccineName: string) {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let granted = existing === 'granted';
  if (!granted) {
    const { status } = await Notifications.requestPermissionsAsync();
    granted = status === 'granted';
  }
  if (!granted) {
    Alert.alert(
      '알림 권한이 꺼져 있어요',
      '설정 앱에서 알림을 켜야 백신 알림을 받을 수 있어요.',
      [{ text: '확인' }],
    );
    return false;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `💉 ${vaccineName} 접종일이 곧 다가와요`,
      body: '예정일 3일 전 이런 알림을 받게 돼요. (미리보기)',
      sound: true,
    },
    trigger: { seconds: 5, channelId: 'default' } as any,
  });
  return true;
}
