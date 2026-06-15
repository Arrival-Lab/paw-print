import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from 'expo-router';
import i18n from '../i18n';

/**
 * 스택 화면(모달 아님)에서 작성 중인 내용이 있을 때 이탈 확인.
 * `beforeRemove` 로 헤더 뒤로가기·안드로이드 하드웨어 백·스와이프 제스처를 모두 가로채,
 * dirty 면 확인 Alert 후에만 실제로 나간다.
 *
 * 저장 성공 후처럼 의도적으로 나가는 프로그램 네비게이션은 `allowLeave()` 를 먼저 호출해
 * 가드를 건너뛴다. (router.back() 등이 beforeRemove 를 또 트리거하기 때문)
 *
 * 모달(presentationStyle="pageSheet")은 네비게이션 스택이 아니므로 이 훅 대신
 * shared/utils/confirmLeave 의 confirmLeaveIfDirty 를 onRequestClose/헤더 back 에 직접 쓴다.
 */
export function useLeaveConfirm(isDirty: boolean) {
  const navigation = useNavigation();
  const bypassRef = useRef(false);

  const allowLeave = () => { bypassRef.current = true; };

  useEffect(() => {
    const sub = navigation.addListener('beforeRemove', (e: any) => {
      if (!isDirty || bypassRef.current) return;
      e.preventDefault();
      Alert.alert(
        i18n.t('leave.title'),
        i18n.t('leave.body'),
        [
          { text: i18n.t('leave.keep'), style: 'cancel' },
          {
            text: i18n.t('leave.leave'),
            style: 'destructive',
            onPress: () => { bypassRef.current = true; navigation.dispatch(e.data.action); },
          },
        ],
      );
    });
    return sub;
  }, [navigation, isDirty]);

  return { allowLeave };
}
