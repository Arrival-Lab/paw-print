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
    id: 3,
    title: '홈 화면 위젯 업데이트 (v1.2.0)',
    date: '2026-06-15',
    content:
      '홈 화면 위젯이 추가됐어요! 앱을 열지 않아도 "오늘 할 일"과 다가오는 예약·예방접종 D-day를 홈 화면에서 바로 확인하세요. 홈 화면을 길게 눌러 "발자국" 위젯을 추가할 수 있어요. 그 외 입력 화면 사용성 개선과 자잘한 버그 수정도 함께 적용했어요.',
  },
  {
    id: 2,
    title: '발자국 정식 출시 안내',
    date: '2026-06-07',
    content:
      '발자국이 정식 출시되었어요! 비공개 베타 동안 보내주신 소중한 의견 덕분에 더 단단해졌어요. 앞으로도 반려동물과 보호자를 위한 건강 일지를 꾸준히 발전시켜 갈게요. 많은 관심과 사랑 부탁드려요 🐾',
  },
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
