import React from 'react';
import { View, Text, Linking, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import ScreenHeader from '../shared/components/ScreenHeader';
import Card from '../shared/components/Card';

const SUPPORT_EMAIL = 'chaeon.studio@gmail.com';
const SUBJECT = '[발자국 베타 테스터 신청]';
const BODY =
  '안녕하세요! 발자국 베타 테스터로 참여하고 싶어요.\n\n' +
  '(이대로 보내주셔도 좋아요. 한 마디 남기고 싶으시면 아래에 자유롭게 적어주세요.)\n\n';

export default function BetaSignupScreen() {
  const Colors = useColors();

  const handleEmailPress = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(BODY)}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert('이메일 앱을 열 수 없어요', `${SUPPORT_EMAIL} 으로 직접 메일을 보내주세요.`);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader title="베타 테스터 신청" back />

      <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
        <Card variant="elevated" padding="lg">
          <Text style={{ ...Typography.preset.title, color: Colors.text.primary, marginBottom: Spacing.sm }}>
            함께 발자국을 만들어가요
          </Text>
          <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginBottom: Spacing.md }}>
            아래 버튼을 눌러 이메일만 보내주시면, TestFlight(iOS) 또는 Google Play 내부 테스트(Android) 초대를
            보내드려요. 따로 적으실 내용이 없다면 그대로 전송해 주셔도 괜찮아요.
          </Text>
          <TouchableOpacity
            onPress={handleEmailPress}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm,
              backgroundColor: Colors.primaryLight,
              borderRadius: Spacing.borderRadius.md,
              padding: Spacing.md,
            }}
          >
            <Feather name="mail" size={18} color={Colors.primary} />
            <Text style={{ ...Typography.preset.bodyMedium, color: Colors.primaryDark }}>
              이메일로 신청하기
            </Text>
            <Feather
              name="external-link"
              size={14}
              color={Colors.primary}
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>
        </Card>

        <Card variant="tinted" padding="lg">
          <Text style={{ ...Typography.preset.title, color: Colors.text.primary, marginBottom: Spacing.sm }}>
            테스터에게 부탁드리는 것
          </Text>
          {[
            '앱을 자유롭게 써보시고 솔직한 피드백을 남겨주세요',
            '버그나 어색한 부분을 발견하면 알려주세요',
            '추가했으면 하는 기능 제안도 환영해요',
          ].map((item) => (
            <View
              key={item}
              style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: Spacing.xs }}
            >
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
