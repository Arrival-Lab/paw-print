import { Alert } from 'react-native';
import i18n from '../i18n';

/**
 * 입력 폼에서 나가기 전 확인.
 * 작성 중인 내용(dirty)이 있으면 확인 Alert, 없으면 즉시 onLeave 실행.
 *
 * 헤더 뒤로가기 버튼과 Android 하드웨어 뒤로가기(Modal 의 onRequestClose) 양쪽에서
 * 같은 핸들러로 호출해 동작을 통일한다.
 */
export function confirmLeaveIfDirty(isDirty: boolean, onLeave: () => void) {
  if (!isDirty) {
    onLeave();
    return;
  }
  Alert.alert(
    i18n.t('leave.title'),
    i18n.t('leave.body'),
    [
      { text: i18n.t('leave.keep'), style: 'cancel' },
      { text: i18n.t('leave.leave'), style: 'destructive', onPress: onLeave },
    ],
  );
}
