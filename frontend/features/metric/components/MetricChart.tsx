import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import { localizeUnit } from '../api/metricApi';
import type { MetricPoint } from '../api/metricApi';

interface Props {
  data: MetricPoint[];
  unit?: string;
  /** 차트 점 탭 시 해당 데이터 포인트의 measuredAt 전달 — 부모에서 리스트 항목 강조에 사용. */
  onPointPress?: (measuredAt: string) => void;
  /** 차트 폭. 미지정 시 SCREEN_WIDTH - 32 (양옆 Spacing.lg 컨테이너 가정). */
  width?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export function MetricChart({ data, unit, onPointPress, width }: Props) {
  const Colors = useColors();
  const { t } = useTranslation();
  const chartWidth = width ?? SCREEN_WIDTH - 32;

  if (data.length === 0) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32 }}>
        <Text style={{ ...Typography.preset.body, color: Colors.text.tertiary }}>{t('metric.noData')}</Text>
      </View>
    );
  }

  // 같은 날짜에 여러 기록이 있으면 그래프 X축에 같은 날짜가 중복으로 표시되는 버그 fix.
  // 날짜(YYYY-MM-DD) 로 group 후 단위에 따라 집계:
  //  - 횟수/양 단위(회/ml/g) → sum  (구토/배변/소변/음수량/식사량 — 하루 총량 의미)
  //  - 그 외 (kg/mg/dL 등 측정값) → 가장 최근 measuredAt 의 값  (체중/BUN/크레아티닌)
  const isSumUnit = unit === '회' || unit === 'ml' || unit === 'g';
  const grouped = data.reduce<Record<string, MetricPoint[]>>((acc, p) => {
    const date = p.measuredAt.slice(0, 10);
    (acc[date] ??= []).push(p);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort();
  const labels = sortedDates.map((d) => d.slice(5));
  const values = sortedDates.map((d) => {
    const points = grouped[d];
    if (isSumUnit) return points.reduce((s, p) => s + Number(p.value), 0);
    const latest = points.reduce((a, b) => (a.measuredAt > b.measuredAt ? a : b));
    return Number(latest.value);
  });

  return (
    <View>
      <LineChart
        data={{ labels, datasets: [{ data: values }] }}
        width={chartWidth}
        height={200}
        chartConfig={{
          backgroundColor: Colors.surface,
          backgroundGradientFrom: Colors.surface,
          backgroundGradientTo: Colors.surface,
          decimalPlaces: 1,
          color: () => Colors.primary,
          labelColor: () => Colors.text.tertiary,
          propsForDots: { r: '3', strokeWidth: '0', stroke: Colors.primary },
          propsForBackgroundLines: { stroke: Colors.border, strokeWidth: 0.5 },
          fillShadowGradient: Colors.primary,
          fillShadowGradientOpacity: 0.05,
        }}
        bezier
        withInnerLines={false}
        style={{ borderRadius: 12 }}
        yAxisSuffix={unit ? ` ${localizeUnit(unit)}` : ''}
        onDataPointClick={
          onPointPress
            ? ({ index }) => {
                // group key (YYYY-MM-DD) 전달 — 부모는 startsWith 로 그 날의 모든 기록 강조.
                const date = sortedDates[index];
                if (date) onPointPress(date);
              }
            : undefined
        }
      />
      {onPointPress ? (
        <Text
          style={{
            ...Typography.preset.caption,
            marginTop: 4,
            textAlign: 'right',
            color: Colors.text.tertiary,
          }}
        >
          {t('metric.pointHint')}
        </Text>
      ) : null}
    </View>
  );
}
