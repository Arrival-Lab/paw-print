import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Spacing, Typography } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import ScreenHeader from '../shared/components/ScreenHeader';
import Card from '../shared/components/Card';

const ITEMS: {
  key: string;
  label: string;
  caption: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  route?: string;
  url?: string;
}[] = [
  { key: 'notice', label: '공지사항', caption: '서비스 업데이트와 안내', icon: 'volume-2', route: '/notices' },
  { key: 'inquiry', label: '문의하기', caption: '버그 신고 · 기능 제안', icon: 'message-square', route: '/inquiry' },
  // 약관·라이선스·계정 삭제·베타 안내는 S3 + CloudFront 정적 hub 로 통일. backend 재배포 없이 즉시 반영.
  { key: 'support-center', label: '고객센터', caption: '약관 · 라이선스 · 계정 삭제', icon: 'help-circle', url: 'https://pawprintapp.link/support' },
];

export default function HelpScreen() {
  const Colors = useColors();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }} edges={['top']}>
      <ScreenHeader title="도움말" back />
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
                  {item.label}
                </Text>
                <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: 2 }}>
                  {item.caption}
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
