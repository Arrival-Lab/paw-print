import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView, Alert, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import ScreenHeader from '../../../shared/components/ScreenHeader';
import Chip from '../../../shared/components/Chip';
import Fab from '../../../shared/components/Fab';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import { useRefresh } from '../../../shared/hooks/useRefresh';
import { useAuthStore } from '../../auth/store/authStore';
import { useUiStore } from '../../../shared/store/uiStore';
import GlossaryHint from '../../glossary/components/GlossaryHint';
import { MetricChart } from './MetricChart';
import { MetricForm } from './MetricForm';
import { useMetricChart, useMetrics, useCreateMetric, useDeleteMetric } from '../hooks/useMetrics';
import type { MetricType } from '../api/metricApi';

const METRIC_TABS: { label: string; value: MetricType }[] = [
  { label: '체중', value: 'WEIGHT' },
  { label: '음수량', value: 'WATER_INTAKE' },
  { label: '식사량', value: 'FOOD_INTAKE' },
  { label: '배변', value: 'BOWEL_COUNT' },
  { label: '소변', value: 'URINE_COUNT' },
  { label: '구토', value: 'VOMIT_COUNT' },
  { label: 'BUN', value: 'BUN' },
  { label: '크레아티닌', value: 'CREATININE' },
  { label: '직접입력', value: 'CUSTOM' },
];

const UNITS: Record<MetricType, string> = {
  WEIGHT: 'kg',
  BUN: 'mg/dL',
  CREATININE: 'mg/dL',
  WATER_INTAKE: 'ml',
  FOOD_INTAKE: 'g',
  BOWEL_COUNT: '회',
  URINE_COUNT: '회',
  VOMIT_COUNT: '회',
  CUSTOM: '',
};

export function MetricsTab({ selectedPetId, topInset = 0 }: { selectedPetId: number | null; topInset?: number }) {
  const Colors = useColors();
  const [activeType, setActiveType] = useState<MetricType>('WEIGHT');
  const [showForm, setShowForm] = useState(false);
  const [highlightDate, setHighlightDate] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);

  const isFree = user?.subscriptionType === 'FREE';
  const now = new Date();
  const from = isFree
    ? new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().slice(0, 10)
    : undefined;
  const to = now.toISOString().slice(0, 10);

  const { data: chartData = [], isLoading: chartLoading } = useMetricChart(selectedPetId ?? 0, activeType, from, to);
  const { data: metricsData, fetchNextPage, hasNextPage } = useMetrics(selectedPetId ?? 0, activeType);
  const { mutate: create, isPending: creating } = useCreateMetric(selectedPetId ?? 0);
  const { mutate: remove } = useDeleteMetric(selectedPetId ?? 0);
  const { refreshing, onRefresh } = useRefresh([
    ['metrics', selectedPetId ?? 0, activeType],
    ['metric-chart', selectedPetId ?? 0, activeType],
  ]);

  const metrics = metricsData?.pages.flatMap((p) => p.content) ?? [];

  const handleDelete = (id: number) => {
    Alert.alert('삭제', '이 수치를 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => remove(id) },
    ]);
  };

  const handleTabPress = (type: MetricType) => {
    if (isFree && type !== 'WEIGHT') {
      showPremiumModal('프리미엄 구독 시 모든 수치 항목을 무제한으로 기록할 수 있어요.');
    }
    setActiveType(type);
  };

  if (!selectedPetId) return null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topInset, paddingBottom: 200 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} progressViewOffset={topInset} />
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: Spacing.xl }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: Spacing.xl,
              paddingVertical: Spacing.md,
              gap: Spacing.sm,
            }}
            style={{ flex: 1 }}
          >
            {METRIC_TABS.map((tab) => (
              <Chip
                key={tab.value}
                label={tab.label}
                selected={activeType === tab.value}
                onPress={() => handleTabPress(tab.value)}
              />
            ))}
          </ScrollView>
          {activeType === 'BUN' || activeType === 'CREATININE' ? (
            <GlossaryHint term={activeType} />
          ) : null}
        </View>

        {isFree && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: Spacing.xl,
              marginBottom: Spacing.sm,
            }}
          >
            <Feather name="info" size={11} color={Colors.text.tertiary} />
            <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
              무료 플랜은 최근 1개월 데이터만 표시됩니다
            </Text>
          </View>
        )}

        <View style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg }}>
          {chartLoading ? (
            <LoadingSpinner inline label="차트 그리는 중" />
          ) : (
            <MetricChart
              data={chartData}
              unit={metrics[0]?.unit ?? UNITS[activeType]}
              width={Dimensions.get('window').width - Spacing.xl * 2}
              onPointPress={(measuredAt) => {
                setHighlightDate(measuredAt);
                setTimeout(() => setHighlightDate((curr) => (curr === measuredAt ? null : curr)), 3000);
              }}
            />
          )}
        </View>

        <View style={{ paddingHorizontal: Spacing.xl }}>
          <Text
            style={{
              ...Typography.preset.caption,
              color: Colors.text.tertiary,
              fontWeight: Typography.weight.semibold,
              letterSpacing: 0.4,
              marginBottom: Spacing.xs,
            }}
          >
            기록
          </Text>
          {metrics.length === 0 ? (
            <Text
              style={{
                ...Typography.preset.caption,
                color: Colors.text.tertiary,
                textAlign: 'center',
                paddingVertical: Spacing.xl,
              }}
            >
              아직 기록이 없어요
            </Text>
          ) : (
            metrics.map((m, idx) => {
              // MetricChart 가 group key(YYYY-MM-DD) 전달 → startsWith 로 같은 날 모든 항목 강조.
              const isHighlighted = !!highlightDate && m.measuredAt.startsWith(highlightDate);
              return (
                <View
                  key={m.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: Spacing.md,
                    borderTopWidth: idx === 0 ? 0 : 1,
                    borderTopColor: Colors.border,
                    backgroundColor: isHighlighted ? Colors.primaryLight : 'transparent',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...Typography.preset.body, fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>
                      {m.value} {m.unit ?? UNITS[m.metricType]}
                    </Text>
                    <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: 2 }}>
                      {m.measuredAt}
                    </Text>
                  </View>
                  {m.metricName ? (
                    <Text
                      style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginRight: Spacing.md }}
                    >
                      {m.metricName}
                    </Text>
                  ) : null}
                  <TouchableOpacity onPress={() => handleDelete(m.id)} hitSlop={Spacing.hitSlop}>
                    <Feather name="trash-2" size={14} color={Colors.text.tertiary} />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
          {hasNextPage && (
            <TouchableOpacity onPress={() => fetchNextPage()} style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
              <Text style={{ ...Typography.preset.label, color: Colors.primary }}>더 보기</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Fab onPress={() => setShowForm(true)} icon="plus" accessibilityLabel="수치 추가" />

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          <ScreenHeader title="수치 입력" back={() => setShowForm(false)} />
          <MetricForm
            onSubmit={(data) =>
              create({ ...data, metricName: data.metricName ?? undefined }, { onSuccess: () => setShowForm(false) })
            }
            loading={creating}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
