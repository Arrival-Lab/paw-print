import React from 'react';
import { View, Text, Linking, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import ScreenHeader from '../shared/components/ScreenHeader';
import Card from '../shared/components/Card';

const SUPPORT_EMAIL = 'support@arrivallab.com';

export default function InquiryScreen() {
  const Colors = useColors();
  const handleEmailPress = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=발자국 앱 문의`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert('이메일 앱을 열 수 없어요', `${SUPPORT_EMAIL} 으로 직접 메일을 보내주세요.`);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader title="문의하기" back />

      <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
        <Card variant="elevated" padding="lg">
          <Text style={{ ...Typography.preset.title, color: Colors.text.primary, marginBottom: Spacing.sm }}>
            이메일 문의
          </Text>
          <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginBottom: Spacing.md }}>
            궁금한 점이나 불편한 점이 있으시면 아래 이메일로 문의해 주세요. 영업일 기준 1-2일 내에 답변
            드리겠습니다.
          </Text>
          <Pressable
            onPress={handleEmailPress}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm,
              backgroundColor: Colors.primaryLight,
              borderRadius: Spacing.borderRadius.md,
              padding: Spacing.md,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Feather name="mail" size={18} color={Colors.primary} />
            <Text style={{ ...Typography.preset.bodyMedium, color: Colors.primaryDark }}>
              {SUPPORT_EMAIL}
            </Text>
            <Feather
              name="external-link"
              size={14}
              color={Colors.primary}
              style={{ marginLeft: 'auto' }}
            />
          </Pressable>
        </Card>

        <Card variant="tinted" padding="lg">
          <Text style={{ ...Typography.preset.title, color: Colors.text.primary, marginBottom: Spacing.sm }}>
            문의 시 포함해 주세요
          </Text>
          {['기기 종류 및 OS 버전', '앱 버전', '문제 발생 상황 및 재현 방법', '스크린샷 (있는 경우)'].map((item) => (
            <View key={item} style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: Spacing.xs }}>
              <Text style={{ color: Colors.primary, marginRight: Spacing.sm, lineHeight: 22 }}></Text>
              <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, flex: 1 }}>
                {item}
              </Text>
            </View>
          ))}
        </Card>
      </View>
    </SafeAreaView>
  );
}
