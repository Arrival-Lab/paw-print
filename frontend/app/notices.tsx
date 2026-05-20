import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing, Typography } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import ScreenHeader from '../shared/components/ScreenHeader';
import Card from '../shared/components/Card';
import EmptyState from '../shared/components/EmptyState';

const NOTICES = [
  {
    id: 1,
    title: '발자국 서비스 오픈 안내',
    date: '2025-01-01',
    content: '발자국 서비스가 정식 오픈되었습니다. 반려동물과 함께하는 건강 일지를 시작해보세요!',
  },
  {
    id: 2,
    title: '이용약관 업데이트 안내',
    date: '2025-01-15',
    content: '개인정보처리방침 및 이용약관이 일부 업데이트되었습니다. 앱 설정에서 확인하실 수 있습니다.',
  },
];

export default function NoticesScreen() {
  const Colors = useColors();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader title="공지사항" back />

      <FlatList
        data={NOTICES}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, paddingBottom: Spacing.xxxl }}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          <EmptyState icon="bell-off" title="공지사항이 없어요" tone="muted" />
        }
        renderItem={({ item }) => (
          <Card variant="outlined" padding="md">
            <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginBottom: 4 }}>
              {item.date}
            </Text>
            <Text style={{ ...Typography.preset.title, color: Colors.text.primary, marginBottom: Spacing.xs }}>
              {item.title}
            </Text>
            <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary }}>
              {item.content}
            </Text>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
