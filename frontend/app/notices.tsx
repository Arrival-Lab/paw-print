import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing, Typography } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import ScreenHeader from '../shared/components/ScreenHeader';
import Card from '../shared/components/Card';
import EmptyState from '../shared/components/EmptyState';

// 날짜는 코드 보유, 제목·내용은 i18n notice.items (동일 순서).
const NOTICE_DATES = ['2026-06-15', '2026-06-07', '2026-05-22'];

export default function NoticesScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const items = t('notice.items', { returnObjects: true }) as { title: string; content: string }[];
  const notices = NOTICE_DATES.map((date, idx) => ({ id: NOTICE_DATES.length - idx, date, ...items[idx] }));
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader title={t('notice.title')} back />

      <FlatList
        data={notices}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, paddingBottom: Spacing.xxxl }}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          <EmptyState icon="bell-off" title={t('notice.empty')} tone="muted" />
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
