import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import i18n from '../../../shared/i18n';

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
      i18n.t('vaccine.permOffTitle'),
      i18n.t('vaccine.permOffBody'),
      [{ text: i18n.t('action.confirm') }],
    );
    return false;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('vaccine.previewNotifTitle', { name: vaccineName }),
      body: i18n.t('vaccine.previewNotifBody'),
      sound: true,
    },
    trigger: { seconds: 5, channelId: 'default' } as any,
  });
  return true;
}
