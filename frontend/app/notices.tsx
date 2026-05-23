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
    title: '발자국 비공개 베타 오픈 안내',
    date: '2026-05-22',
    content: '발자국이 비공개 베타로 만나뵙고 있어요. 함께 발자국을 만들어가는 베타 기간 동안 의견·피드백을 자유롭게 보내 주세요. 반려동물과 함께하는 건강 일지를 시작해 보세요!',
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
