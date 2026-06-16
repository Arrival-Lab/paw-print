import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Spacing, Typography } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import ScreenHeader from '../shared/components/ScreenHeader';
import Card from '../shared/components/Card';

// 라벨·캡션은 i18n help.items.{tkey}. route/url/icon 은 코드 보유.
const ITEMS: {
  key: string;
  tkey: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  route?: string;
  url?: string;
}[] = [
  { key: 'notice', tkey: 'notice', icon: 'volume-2', route: '/notices' },
  { key: 'inquiry', tkey: 'inquiry', icon: 'message-square', route: '/inquiry' },
  // 약관·라이선스·계정 삭제·베타 안내는 S3 + CloudFront 정적 hub 로 통일. backend 재배포 없이 즉시 반영.
  { key: 'support-center', tkey: 'support', icon: 'help-circle', url: 'https://pawprintapp.link/support' },
];

export default function HelpScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }} edges={['top']}>
      <ScreenHeader title={t('help.title')} back />
      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, paddingBottom: Spacing.xxxl }}>
        <Card variant="elevated" padding="none">
          {ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.7}
              onPress={() => {
                if (item.url) Linking.openURL(item.url);
                else if (item.route) router.push(item.route as any);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.md,
                paddingHorizontal: Spacing.xl,
                paddingVertical: Spacing.lg,
                borderTopWidth: idx === 0 ? 0 : 1,
                borderTopColor: Colors.border,
              }}
            >
              <Feather name={item.icon} size={20} color={Colors.text.secondary} />
              <View style={{ flex: 1 }}>
                <Text style={{ ...Typography.preset.body, color: Colors.text.primary }}>
                  {t(`help.items.${item.tkey}.label`)}
                </Text>
                <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: 2 }}>
                  {t(`help.items.${item.tkey}.caption`)}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
            </TouchableOpacity>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
