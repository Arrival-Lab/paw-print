import React, { useState } from 'react';
import { View, Text, Modal, Platform, Linking, TouchableWithoutFeedback } from 'react-native';
import Constants from 'expo-constants';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography, Elevation } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import Button from '../../../shared/components/Button';
import { appUpdateApi } from '../api/appUpdateApi';

// "1.2.0" → [1,2,0]. 비교 결과 a<b: -1, a==b: 0, a>b: 1.
function compareVersion(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
}

// 발자국 실제 스토어 식별자. 스킴 먼저 시도(스토어 앱 직접) → 실패 시 https 폴백.
const STORE: Record<'ios' | 'android', { scheme: string; web: string }> = {
  ios: {
    scheme: 'itms-apps://apps.apple.com/app/id6762686771',
    web: 'https://apps.apple.com/app/id6762686771',
  },
  android: {
    scheme: 'market://details?id=com.arrivallab.pawprint',
    web: 'https://play.google.com/store/apps/details?id=com.arrivallab.pawprint',
  },
};

/**
 * 앱 실행 시 스토어 업데이트 안내. 백엔드 /api/app/version 의 min/latest 와 설치 버전 비교:
 * - 설치 < min → 강제(닫기 불가)
 * - 설치 < latest → 권장(나중에 가능, 세션 1회 닫힘)
 * 네이티브 변경은 OTA 로 못 나가므로 사용자를 스토어로 유도하는 용도.
 */
export default function AppUpdateGate() {
  const Colors = useColors();
  const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android';
  const installed = Constants.expoConfig?.version ?? '0.0.0';
  const [dismissed, setDismissed] = useState(false);

  const { data } = useQuery({
    queryKey: ['app-version', platform],
    queryFn: () => appUpdateApi.getVersionInfo(platform),
    staleTime: 60 * 60 * 1000,
    retry: false,
  });

  if (!data) return null;

  const needForce = compareVersion(installed, data.minVersion) < 0;
  const needRecommend = !needForce && compareVersion(installed, data.latestVersion) < 0;
  const visible = needForce || (needRecommend && !dismissed);
  if (!visible) return null;

  const openStore = async () => {
    const s = STORE[platform];
    try {
      const ok = await Linking.canOpenURL(s.scheme);
      await Linking.openURL(ok ? s.scheme : s.web);
    } catch {
      Linking.openURL(s.web);
    }
  };

  const close = () => {
    if (!needForce) setDismissed(true);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <TouchableWithoutFeedback onPress={close}>
        <View style={{ flex: 1, backgroundColor: Colors.scrim, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl }}>
          <TouchableWithoutFeedback>
            <View
              style={{
                width: '100%',
                maxWidth: 360,
                backgroundColor: Colors.surfaceElevated,
                borderRadius: Spacing.borderRadius.xl,
                padding: Spacing.xxl,
                alignItems: 'center',
                gap: Spacing.md,
                ...Elevation.modal,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: Colors.primaryLight,
                }}
              >
                <Feather name="arrow-up-circle" size={28} color={Colors.primaryDark} />
              </View>

              <Text style={{ ...Typography.preset.h3, color: Colors.text.primary, textAlign: 'center' }}>
                {needForce ? '업데이트가 필요해요' : '새로운 버전이 있어요'}
              </Text>
              <Text style={{ ...Typography.preset.body, color: Colors.text.secondary, textAlign: 'center' }}>
                {needForce
                  ? '원활한 사용을 위해 최신 버전으로 업데이트해주세요. 업데이트 후 계속 이용할 수 있어요.'
                  : '더 나아진 발자국을 만나보세요. 지금 업데이트하시겠어요?'}
              </Text>

              <View style={{ width: '100%', marginTop: Spacing.sm, gap: Spacing.sm }}>
                <Button variant="primary" fullWidth icon="download" onPress={openStore}>
                  {platform === 'ios' ? 'App Store 에서 업데이트' : 'Play 스토어에서 업데이트'}
                </Button>
                {!needForce ? (
                  <Button variant="ghost" fullWidth onPress={close}>
                    나중에
                  </Button>
                ) : null}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
