import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import DateInput from '../../../shared/components/DateInput';
import type { MetricType } from '../api/metricApi';

const schema = z.object({
  metricType: z.enum(['WEIGHT', 'BUN', 'CREATININE', 'CUSTOM']),
  metricName: z.string().optional(),
  value: z.string().min(1, '수치를 입력하세요').refine((v) => !isNaN(Number(v)), '숫자만 입력하세요'),
  unit: z.string().optional(),
  measuredAt: z.string().min(1, '날짜를 입력하세요'),
});

type FormValues = z.infer<typeof schema>;

const METRIC_TYPES: { label: string; value: MetricType }[] = [
  { label: '체중', value: 'WEIGHT' },
  { label: 'BUN', value: 'BUN' },
  { label: '크레아티닌', value: 'CREATININE' },
  { label: '직접 입력', value: 'CUSTOM' },
];

const DEFAULT_UNITS: Record<MetricType, string> = {
  WEIGHT: 'kg',
  BUN: 'mg/dL',
  CREATININE: 'mg/dL',
  CUSTOM: '',
};

interface Props {
  onSubmit: (data: FormValues & { value: number }) => void;
  loading?: boolean;
}

export function MetricForm({ onSubmit, loading }: Props) {
  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      metricType: 'WEIGHT',
      measuredAt: new Date().toISOString().slice(0, 10),
    },
  });

  const metricType = watch('metricType');

  const handleFormSubmit = (data: FormValues) => {
    onSubmit({ ...data, value: Number(data.value) });
  };

  return (
    <ScrollView className="px-4 py-4">
      <Text className="text-sm font-medium text-text-secondary mb-2">측정 항목</Text>
      <Controller
        control={control}
        name="metricType"
        render={({ field: { value, onChange } }) => (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {METRIC_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                onPress={() => onChange(t.value)}
                className={`px-3 py-2 rounded-full border ${
                  value === t.value
                    ? 'bg-primary border-primary'
                    : 'bg-white border-border'
                }`}>
                <Text className={value === t.value ? 'text-white text-sm' : 'text-text-secondary text-sm'}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />

      {metricType === 'CUSTOM' && (
        <Controller
          control={control}
          name="metricName"
          render={({ field: { value, onChange } }) => (
            <View className="mb-4">
              <Text className="text-sm font-medium text-text-secondary mb-1">항목명</Text>
              <TextInput
                className="border border-border rounded-xl px-3 py-3 text-text-primary"
                value={value}
                onChangeText={onChange}
                placeholder="예: 혈당"
              />
            </View>
          )}
        />
      )}

      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Text className="text-sm font-medium text-text-secondary mb-1">수치</Text>
          <Controller
            control={control}
            name="value"
            render={({ field: { value, onChange } }) => (
              <TextInput
                className="border border-border rounded-xl px-3 py-3 text-text-primary"
                value={value}
                onChangeText={onChange}
                keyboardType="decimal-pad"
                placeholder="0.0"
              />
            )}
          />
          {errors.value && <Text className="text-status-error text-xs mt-1">{errors.value.message}</Text>}
        </View>

        <View className="w-24">
          <Text className="text-sm font-medium text-text-secondary mb-1">단위</Text>
          <Controller
            control={control}
            name="unit"
            render={({ field: { value, onChange } }) => (
              <TextInput
                className="border border-border rounded-xl px-3 py-3 text-text-primary"
                value={value ?? DEFAULT_UNITS[metricType]}
                onChangeText={onChange}
                placeholder={DEFAULT_UNITS[metricType]}
              />
            )}
          />
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-sm font-medium text-text-secondary mb-1">측정일</Text>
        <Controller
          control={control}
          name="measuredAt"
          render={({ field: { value, onChange } }) => (
            <DateInput
              value={value}
              onChange={onChange}
              title="측정일"
              hasError={!!errors.measuredAt}
              maxDate={new Date().toISOString().split('T')[0]}
            />
          )}
        />
        {errors.measuredAt && (
          <Text className="text-status-error text-xs mt-1">{errors.measuredAt.message}</Text>
        )}
      </View>

      <TouchableOpacity
        onPress={handleSubmit(handleFormSubmit)}
        disabled={loading}
        className="bg-primary rounded-xl py-4 items-center">
        <Text className="text-white font-semibold text-base">
          {loading ? '저장 중...' : '저장'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
