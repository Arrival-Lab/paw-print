import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useColors } from '../../../shared/hooks/useTheme';
import type { MetricPoint } from '../api/metricApi';

interface Props {
  data: MetricPoint[];
  unit?: string;
  /** 차트 점 탭 시 해당 데이터 포인트의 measuredAt 전달 — 부모에서 리스트 항목 강조에 사용. */
  onPointPress?: (measuredAt: string) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export function MetricChart({ data, unit, onPointPress }: Props) {
  const Colors = useColors();

  if (data.length === 0) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32 }}>
        <Text style={{ color: Colors.text.tertiary, fontSize: 13 }}>데이터가 없습니다</Text>
      </View>
    );
  }

  const labels = data.map((p) => p.measuredAt.slice(5));
  const values = data.map((p) => Number(p.value));

  return (
    <View>
      <LineChart
        data={{ labels, datasets: [{ data: values }] }}
        width={SCREEN_WIDTH - 32}
        height={200}
        chartConfig={{
          backgroundColor: Colors.surfaceElevated,
          backgroundGradientFrom: Colors.surfaceElevated,
          backgroundGradientTo: Colors.surfaceElevated,
          decimalPlaces: 1,
          color: () => Colors.primary,
          labelColor: () => Colors.text.secondary,
          propsForDots: { r: '4', strokeWidth: '2', stroke: Colors.primary },
        }}
        bezier
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
            marginTop: 4,
            textAlign: 'right',
            fontSize: 11,
            color: Colors.text.tertiary,
          }}
        >
          점을 누르면 아래 기록에서 강조돼요
        </Text>
      ) : null}
    </View>
  );
}
