import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
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
  const chartWidth = width ?? SCREEN_WIDTH - 32;

  if (data.length === 0) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32 }}>
        <Text style={{ ...Typography.preset.body, color: Colors.text.tertiary }}>데이터가 없습니다</Text>
      </View>
    );
  }

  const labels = data.map((p) => p.measuredAt.slice(5));
  const values = data.map((p) => Number(p.value));

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
        yAxisSuffix={unit ? ` ${unit}` : ''}
        onDataPointClick={
          onPointPress
            ? ({ index }) => {
                const point = data[index];
                if (point) onPointPress(point.measuredAt);
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
          점을 누르면 아래 기록에서 강조돼요
        </Text>
      ) : null}
    </View>
  );
}
