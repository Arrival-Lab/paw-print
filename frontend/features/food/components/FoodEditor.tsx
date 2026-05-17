import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import type { FoodInfo, FoodInfoRequest } from '../api/foodApi';

interface Props {
  initial?: FoodInfo | null;
  onSubmit: (data: FoodInfoRequest) => void;
  loading?: boolean;
}

interface ChipInputProps {
  label: string;
  chips: string[];
  onChange: (chips: string[]) => void;
  chipColor: string;
}

function ChipInput({ label, chips, onChange, chipColor }: ChipInputProps) {
  const Colors = useColors();
  const [text, setText] = useState('');

  const addChip = () => {
    const trimmed = text.trim();
    if (trimmed && !chips.includes(trimmed)) {
      onChange([...chips, trimmed]);
    }
    setText('');
  };

  const removeChip = (chip: string) => {
    onChange(chips.filter((c) => c !== chip));
  };

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-text-secondary mb-2">{label}</Text>
      <View className="flex-row flex-wrap gap-2 mb-2">
        {chips.map((chip) => (
          <TouchableOpacity
            key={chip}
            onPress={() => removeChip(chip)}
            className="flex-row items-center px-3 py-1 rounded-full"
            style={{ backgroundColor: `${chipColor}20` }}>
            <Text className="text-sm mr-1" style={{ color: chipColor }}>
              {chip}
            </Text>
            <Text className="text-xs" style={{ color: chipColor }}>✕</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View className="flex-row items-center gap-2">
        <TextInput
          className="flex-1 border border-border rounded-xl px-3 py-3 text-text-primary"
          value={text}
          onChangeText={setText}
          onSubmitEditing={addChip}
          placeholder="입력 후 추가"
          returnKeyType="done"
        />
        <TouchableOpacity
          onPress={addChip}
          disabled={!text.trim()}
          className="px-4 py-3 rounded-xl"
          style={{
            backgroundColor: Colors.primaryLight,
            opacity: text.trim() ? 1 : 0.5,
          }}>
          <Text className="text-sm font-semibold" style={{ color: Colors.primary }}>
            추가
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * "현재 사료" 텍스트에서 알러지·금지 음식 키워드가 매칭되는지 검사.
 * 한국어/영어 단순 substring 매칭 + 대소문자 무시. 거짓 양성을 줄이려 2글자 이상 키워드만 비교.
 */
function detectFoodConflicts(currentFood: string, allergies: string[], forbidden: string[]): { allergy: string[]; forbidden: string[] } {
  const food = currentFood.toLowerCase();
  const match = (list: string[]) =>
    list.filter((k) => k.trim().length >= 2 && food.includes(k.trim().toLowerCase()));
  return {
    allergy: match(allergies),
    forbidden: match(forbidden),
  };
}

export function FoodEditor({ initial, onSubmit, loading }: Props) {
  const Colors = useColors();
  const { control, handleSubmit, watch } = useForm<{ currentFood: string; notes: string }>({
    defaultValues: {
      currentFood: initial?.currentFood ?? '',
      notes: initial?.notes ?? '',
    },
  });
  const [allergies, setAllergies] = useState<string[]>(initial?.allergies ?? []);
  const [forbiddenFoods, setForbiddenFoods] = useState<string[]>(initial?.forbiddenFoods ?? []);
  const currentFoodValue = watch('currentFood') ?? '';

  const conflicts = useMemo(
    () => detectFoodConflicts(currentFoodValue, allergies, forbiddenFoods),
    [currentFoodValue, allergies, forbiddenFoods],
  );
  const hasConflict = conflicts.allergy.length > 0 || conflicts.forbidden.length > 0;

  const handleFormSubmit = (data: { currentFood: string; notes: string }) => {
    onSubmit({ ...data, allergies, forbiddenFoods });
  };

  return (
    <ScrollView className="px-4 py-4">
      {hasConflict ? (
        <View
          style={{
            marginBottom: Spacing.lg,
            padding: Spacing.md,
            borderRadius: Spacing.borderRadius.lg,
            backgroundColor: Colors.status.errorBg,
            flexDirection: 'row',
            gap: Spacing.sm,
            alignItems: 'flex-start',
            borderWidth: 1,
            borderColor: Colors.status.error,
          }}
        >
          <Feather name="alert-triangle" size={16} color={Colors.status.error} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ ...Typography.preset.bodyMedium, color: Colors.status.error, fontWeight: Typography.weight.bold }}>
              현재 사료에 위험 성분이 있어요
            </Text>
            {conflicts.allergy.length > 0 ? (
              <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 4 }}>
                알러지 항목: <Text style={{ fontWeight: Typography.weight.bold, color: Colors.status.error }}>{conflicts.allergy.join(', ')}</Text>
              </Text>
            ) : null}
            {conflicts.forbidden.length > 0 ? (
              <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                금지 음식: <Text style={{ fontWeight: Typography.weight.bold, color: Colors.status.warning }}>{conflicts.forbidden.join(', ')}</Text>
              </Text>
            ) : null}
            <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: 4 }}>
              사료를 바꾸거나 알러지·금지 항목을 다시 확인해주세요.
            </Text>
          </View>
        </View>
      ) : null}

      <View className="mb-4">
        <Text className="text-sm font-medium text-text-secondary mb-1">현재 사료</Text>
        <Controller
          control={control}
          name="currentFood"
          render={({ field: { value, onChange } }) => (
            <TextInput
              className="border rounded-xl px-3 py-3 text-text-primary"
              style={{ borderColor: hasConflict ? Colors.status.error : Colors.border }}
              value={value}
              onChangeText={onChange}
              placeholder="예: 로얄캐닌 인도어"
              multiline
            />
          )}
        />
      </View>

      <ChipInput
        label="알레르기"
        chips={allergies}
        onChange={setAllergies}
        chipColor={Colors.status.error}
      />

      <ChipInput
        label="금지 음식"
        chips={forbiddenFoods}
        onChange={setForbiddenFoods}
        chipColor={Colors.status.warning}
      />

      <View className="mb-6">
        <Text className="text-sm font-medium text-text-secondary mb-1">메모</Text>
        <Controller
          control={control}
          name="notes"
          render={({ field: { value, onChange } }) => (
            <TextInput
              className="border border-border rounded-xl px-3 py-3 text-text-primary"
              value={value}
              onChangeText={onChange}
              placeholder="식이 관련 메모"
              multiline
              numberOfLines={3}
            />
          )}
        />
      </View>

      <TouchableOpacity
        onPress={handleSubmit(handleFormSubmit)}
        disabled={loading}
        className="rounded-xl py-4 items-center"
        style={{ backgroundColor: Colors.primaryDark }}>
        <Text className="text-white font-semibold text-base">
          {loading ? '저장 중...' : '저장'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
