import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Colors } from '../../../constants/colors';
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
      <View className="flex-row items-center border border-border rounded-xl overflow-hidden">
        <TextInput
          className="flex-1 px-3 py-3 text-text-primary"
          value={text}
          onChangeText={setText}
          onSubmitEditing={addChip}
          placeholder="입력 후 추가"
          returnKeyType="done"
        />
        <TouchableOpacity
          onPress={addChip}
          className="px-4 py-3"
          style={{ backgroundColor: chipColor }}>
          <Text className="text-white text-sm font-medium">추가</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function FoodEditor({ initial, onSubmit, loading }: Props) {
  const { control, handleSubmit } = useForm<{ currentFood: string; notes: string }>({
    defaultValues: {
      currentFood: initial?.currentFood ?? '',
      notes: initial?.notes ?? '',
    },
  });
  const [allergies, setAllergies] = useState<string[]>(initial?.allergies ?? []);
  const [forbiddenFoods, setForbiddenFoods] = useState<string[]>(initial?.forbiddenFoods ?? []);

  const handleFormSubmit = (data: { currentFood: string; notes: string }) => {
    onSubmit({ ...data, allergies, forbiddenFoods });
  };

  return (
    <ScrollView className="px-4 py-4">
      <View className="mb-4">
        <Text className="text-sm font-medium text-text-secondary mb-1">현재 사료</Text>
        <Controller
          control={control}
          name="currentFood"
          render={({ field: { value, onChange } }) => (
            <TextInput
              className="border border-border rounded-xl px-3 py-3 text-text-primary"
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
        className="bg-primary rounded-xl py-4 items-center">
        <Text className="text-white font-semibold text-base">
          {loading ? '저장 중...' : '저장'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
