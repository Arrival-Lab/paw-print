import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import DateInput from '../../../shared/components/DateInput';
import { useColors } from '../../../shared/hooks/useTheme';
import type { MetricType } from '../api/metricApi';
import { METRIC_TYPE_UNIT } from '../api/metricApi';

const schema = z.object({
  metricType: z.enum([
    'WEIGHT', 'BUN', 'CREATININE',
    'WATER_INTAKE', 'FOOD_INTAKE', 'BOWEL_COUNT', 'URINE_COUNT', 'VOMIT_COUNT',
    'CUSTOM',
  ]),
  metricName: z.string().optional(),
  value: z.string().min(1, 'metric.valueRequired').refine((v) => !isNaN(Number(v)), 'metric.numberOnly'),
  unit: z.string().optional(),
  measuredAt: z.string().min(1, 'metric.dateRequired'),
});

type FormValues = z.infer<typeof schema>;

const METRIC_TYPE_ORDER: MetricType[] = [
  'WEIGHT', 'WATER_INTAKE', 'FOOD_INTAKE', 'BOWEL_COUNT', 'URINE_COUNT', 'VOMIT_COUNT', 'BUN', 'CREATININE', 'CUSTOM',
];

const DEFAULT_UNITS = METRIC_TYPE_UNIT;

interface Props {
  onSubmit: (data: FormValues & { value: number }) => void;
  loading?: boolean;
  /** 작성 중 내용 변화 보고 — 부모가 뒤로가기 시 저장 안 된 내용 확인 모달을 띄우기 위함. */
  onDirtyChange?: (dirty: boolean) => void;
}

export function MetricForm({ onSubmit, loading, onDirtyChange }: Props) {
  const Colors = useColors();
  const { t } = useTranslation();
  const { control, handleSubmit, watch, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      metricType: 'WEIGHT',
      measuredAt: new Date().toISOString().slice(0, 10),
    },
  });

  useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);

  const metricType = watch('metricType');

  const handleFormSubmit = (data: FormValues) => {
    onSubmit({ ...data, value: Number(data.value) });
  };

  const labelStyle = { color: Colors.text.secondary };
  const inputStyle = { color: Colors.text.primary, borderColor: Colors.border };

  return (
    <ScrollView className="px-4 py-4" style={{ backgroundColor: Colors.background }}>
      <Text className="text-sm font-medium mb-2" style={labelStyle}>{t('metric.measureItem')}</Text>
      <Controller
        control={control}
        name="metricType"
        render={({ field: { value, onChange } }) => (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {METRIC_TYPE_ORDER.map((mt) => {
              const selected = value === mt;
              return (
                <TouchableOpacity
                  key={mt}
                  onPress={() => onChange(mt)}
                  className="px-3 py-2 rounded-full border"
                  style={{
                    backgroundColor: selected ? Colors.primaryDark : Colors.surface,
                    borderColor: selected ? Colors.primaryDark : Colors.border,
                  }}>
                  <Text
                    className="text-sm"
                    style={{ color: selected ? Colors.white : Colors.text.secondary }}>
                    {t(`metric.type.${mt}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      />

      {metricType === 'CUSTOM' && (
        <Controller
          control={control}
          name="metricName"
          render={({ field: { value, onChange } }) => (
            <View className="mb-4">
              <Text className="text-sm font-medium mb-1" style={labelStyle}>{t('metric.itemName')}</Text>
              <TextInput
                className="border rounded-xl px-3 py-3"
                style={inputStyle}
                value={value}
                onChangeText={onChange}
                placeholder={t('metric.itemNamePlaceholder')}
                placeholderTextColor={Colors.text.disabled}
              />
            </View>
          )}
        />
      )}

      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Text className="text-sm font-medium mb-1" style={labelStyle}>{t('metric.value')}</Text>
          <Controller
            control={control}
            name="value"
            render={({ field: { value, onChange } }) => (
              <TextInput
                className="border rounded-xl px-3 py-3"
                style={inputStyle}
                value={value}
                onChangeText={onChange}
                keyboardType="decimal-pad"
                placeholder="0.0"
                placeholderTextColor={Colors.text.disabled}
              />
            )}
          />
          {errors.value && (
            <Text className="text-xs mt-1" style={{ color: Colors.status.error }}>{t(errors.value.message ?? '')}</Text>
          )}
        </View>

        <View className="w-24">
          <Text className="text-sm font-medium mb-1" style={labelStyle}>{t('metric.unit')}</Text>
          <Controller
            control={control}
            name="unit"
            render={({ field: { value, onChange } }) => (
              <TextInput
                className="border rounded-xl px-3 py-3"
                style={inputStyle}
                value={value ?? DEFAULT_UNITS[metricType]}
                onChangeText={onChange}
                placeholder={DEFAULT_UNITS[metricType]}
                placeholderTextColor={Colors.text.disabled}
              />
            )}
          />
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-sm font-medium mb-1" style={labelStyle}>{t('metric.measuredDate')}</Text>
        <Controller
          control={control}
          name="measuredAt"
          render={({ field: { value, onChange } }) => (
            <DateInput
              value={value}
              onChange={onChange}
              title={t('metric.measuredDate')}
              hasError={!!errors.measuredAt}
              maxDate={new Date().toISOString().split('T')[0]}
            />
          )}
        />
        {errors.measuredAt && (
          <Text className="text-xs mt-1" style={{ color: Colors.status.error }}>{t(errors.measuredAt.message ?? '')}</Text>
        )}
      </View>

      <TouchableOpacity
        onPress={handleSubmit(handleFormSubmit)}
        disabled={loading}
        className="rounded-xl py-4 items-center"
        style={{ backgroundColor: Colors.primaryDark }}>
        <Text className="text-white font-semibold text-base">
          {loading ? t('metric.saving') : t('action.save')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
