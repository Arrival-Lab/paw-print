import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import { metricApi, DAILY_METRIC_QUICK, METRIC_TYPE_UNIT } from '../api/metricApi';
import type { MetricType } from '../api/metricApi';

interface Props {
  petId: number;
  /** YYYY-MM-DD. 다이어리 화면이 표시 중인 날짜 — 메트릭의 measuredAt 으로 사용. */
  date: string;
}

/**
 * 일상 트래킹 빠른 입력 — 다이어리 안에서 한 번 탭으로 음수량/식사량/배변/소변/구토 기록.
 * 응답자 [22][25][44][56][59][65] "비정형 메모로 기록 → 그래프 안 됨" 페인 대응.
 */
export default function QuickMetricChips({ petId, date }: Props) {
  const Colors = useColors();
  const queryClient = useQueryClient();
  const [recent, setRecent] = useState<Record<string, number>>({}); // 같은 칩 연타 시 누적 +1 hint
  const [pendingType, setPendingType] = useState<MetricType | null>(null);

  const { mutate } = useMutation({
    mutationFn: (data: { type: MetricType; value: number }) =>
      metricApi.create(petId, {
        metricType: data.type,
        value: data.value,
        unit: METRIC_TYPE_UNIT[data.type],
        measuredAt: date,
      }),
    onMutate: ({ type }) => setPendingType(type),
    onSuccess: (_d, { type, value }) => {
      setRecent((r) => ({ ...r, [type]: (r[type] ?? 0) + value }));
      setPendingType(null);
      queryClient.invalidateQueries({ queryKey: ['metrics', petId] });
      queryClient.invalidateQueries({ queryKey: ['metric-chart', petId] });
    },
    onError: () => setPendingType(null),
  });

  return (
    <View
      style={{
        backgroundColor: Colors.surface,
        borderRadius: Spacing.borderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
        <Feather name="activity" size={14} color={Colors.text.secondary} />
        <Text style={{ ...Typography.preset.label, color: Colors.text.secondary }}>오늘 빠른 기록</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
        {DAILY_METRIC_QUICK.map((q) => {
          const cumulative = recent[q.type] ?? 0;
          const isPending = pendingType === q.type;
          return (
            <TouchableOpacity
              key={q.type}
              disabled={isPending}
              onPress={() => mutate({ type: q.type, value: q.defaultValue })}
              style={{
                backgroundColor: cumulative > 0 ? Colors.primaryLight : Colors.white,
                borderRadius: Spacing.borderRadius.full,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.xs + 2,
                borderWidth: 1,
                borderColor: cumulative > 0 ? Colors.borderStrong : Colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                opacity: isPending ? 0.6 : 1,
              }}
            >
              <Feather name="plus" size={11} color={cumulative > 0 ? Colors.text.accent : Colors.text.secondary} />
              <Text
                style={{
                  ...Typography.preset.bodySmall,
                  color: cumulative > 0 ? Colors.text.accent : Colors.text.primary,
                }}
              >
                {q.label}
              </Text>
              {cumulative > 0 ? (
                <Text style={{ ...Typography.preset.caption, color: Colors.text.accent }}>
                  · 누적 {cumulative}{METRIC_TYPE_UNIT[q.type]}
                </Text>
              ) : null}
              {isPending ? <ActivityIndicator size="small" color={Colors.primary} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: Spacing.sm }}>
        탭 한 번에 기록 · 수치 탭에서 그래프 확인
      </Text>
    </View>
  );
}
