import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Button from '../../shared/components/Button';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { useAcceptInvite } from '../../features/share/hooks/useShare';
import { useAuthStore } from '../../features/auth/store/authStore';

/**
 * 공유 초대 수락 화면.
 * 진입 경로:
 *  - pawprint://share/accept?token=... (custom scheme deep link)
 *  - https://pawprintapp.link/invite/{token} → expo-router associatedDomains 매핑
 *  - 사용자가 share.tsx 에서 토큰 직접 입력 (개발/대체 흐름)
 *
 * 비로그인 상태에서 진입하면 _layout 의 인증 가드가 로그인으로 보냄.
 * 로그인 후 같은 URL 로 재진입 시 자동 수락.
 */
export default function ShareAcceptScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = params.token ?? '';
  const user = useAuthStore((s) => s.user);
  const { mutate: accept, isPending } = useAcceptInvite();
  const [state, setState] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState<string>('');
  const [petName, setPetName] = useState<string>('');

  // 진단용 — universal link 진입 시 metro 콘솔에 로그 남김. 이 화면에 도달했는지 확인 가능.
  useEffect(() => {
    console.log('[ShareAcceptScreen] MOUNTED', { token, hasUser: !!user, params });
  }, []);

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage(t('share.noToken'));
      return;
    }
    if (!user) {
      // 인증 전이면 _layout 가드가 처리 — 여기는 token 만 들고 다시 들어오기 기다림.
      return;
    }
    accept(token, {
      onSuccess: (res: any) => {
        setState('success');
        setPetName(res?.petName ?? t('share.petFallback'));
      },
      onError: (err: any) => {
        setState('error');
        const msg = err?.response?.data?.message;
        setMessage(msg ?? t('share.acceptFailDefault'));
      },
    });
    // token 한 번에만 실행 — accept 재호출 방지.
  }, [token, user]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader title={t('share.inviteTitle')} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.lg }}>
        {state === 'pending' || isPending ? (
          <>
            <LoadingSpinner label={t('share.processing')} />
          </>
        ) : state === 'success' ? (
          <>
            <View
              style={{
                width: 72, height: 72, borderRadius: 36,
                backgroundColor: Colors.status.successBg,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Feather name="check" size={32} color={Colors.status.success} />
            </View>
            <Text style={{ ...Typography.preset.heading, fontWeight: Typography.weight.bold, color: Colors.text.primary, textAlign: 'center' }}>
              {t('share.acceptedTitle')}
            </Text>
            <Text style={{ ...Typography.preset.body, color: Colors.text.secondary, textAlign: 'center' }}>
              {t('share.acceptedBody', { name: petName })}
            </Text>
            <Button onPress={() => router.replace('/(tabs)' as any)} variant="tonal" size="md">
              {t('share.goHome')}
            </Button>
          </>
        ) : (
          <>
            <View
              style={{
                width: 72, height: 72, borderRadius: 36,
                backgroundColor: Colors.status.errorBg,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Feather name="x" size={32} color={Colors.status.error} />
            </View>
            <Text style={{ ...Typography.preset.heading, fontWeight: Typography.weight.bold, color: Colors.text.primary, textAlign: 'center' }}>
              {t('share.cannotAcceptTitle')}
            </Text>
            <Text style={{ ...Typography.preset.body, color: Colors.text.secondary, textAlign: 'center' }}>
              {message}
            </Text>
            <Button onPress={() => router.replace('/(tabs)' as any)} variant="ghost" size="md">
              {t('share.home')}
            </Button>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
