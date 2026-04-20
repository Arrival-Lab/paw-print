import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Colors } from '../../../constants/colors';
import type { MetricPoint } from '../api/metricApi';

interface Props {
  data: MetricPoint[];
  unit?: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export function MetricChart({ data, unit }: Props) {
  if (data.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <Text className="text-text-tertiary text-sm">데이터가 없습니다</Text>
      </View>
    );
  }

  const labels = data.map((p) => p.measuredAt.slice(5)); // MM-DD
  const values = data.map((p) => Number(p.value));

  return (
    <View>
      <LineChart
        data={{ labels, datasets: [{ data: values }] }}
        width={SCREEN_WIDTH - 32}
        height={200}
        chartConfig={{
          backgroundColor: Colors.white,
          backgroundGradientFrom: Colors.white,
          backgroundGradientTo: Colors.white,
          decimalPlaces: 1,
          color: () => Colors.primary,
          labelColor: () => Colors.text.secondary,
          propsForDots: { r: '4', strokeWidth: '2', stroke: Colors.primary },
        }}
        bezier
        style={{ borderRadius: 12 }}
        yAxisSuffix={unit ? ` ${unit}` : ''}
      />
    </View>
  );
}
