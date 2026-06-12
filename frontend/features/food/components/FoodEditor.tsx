import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import { DEFAULT_FORBIDDEN_FOODS } from '../constants/defaultForbiddenFoods';
import type { Pet } from '../../pet/api/petApi';
import type { FoodInfo, FoodInfoRequest } from '../api/foodApi';

interface Props {
  initial?: FoodInfo | null;
  species?: Pet['species'];
  onSubmit: (data: FoodInfoRequest) => void;
  loading?: boolean;
  /** 작성 중 내용 변화 보고 — 부모가 뒤로가기 시 저장 안 된 내용 확인 모달을 띄우기 위함. */
  onDirtyChange?: (dirty: boolean) => void;
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
      <Text className="text-sm font-medium mb-2" style={{ color: Colors.text.secondary }}>{label}</Text>
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
          className="flex-1 border rounded-xl px-3 py-3"
          style={{ color: Colors.text.primary, borderColor: Colors.border }}
          value={text}
          onChangeText={setText}
          onSubmitEditing={addChip}
          placeholder="입력 후 추가"
          placeholderTextColor={Colors.text.disabled}
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
 * "현재 사료" 텍스트에서 알러지/종별 위험 음식 키워드가 매칭되는지 검사.
 * 종별 위험 음식은 사용자가 관리하지 않고 DEFAULT_FORBIDDEN_FOODS 와 자동 비교(가이드 페이지에서만 노출).
 * 한국어/영어 단순 substring 매칭 + 대소문자 무시. 거짓 양성을 줄이려 2글자 이상 키워드만 비교.
 */
function detectFoodConflicts(currentFood: string, allergies: string[], speciesForbidden: string[]): { allergy: string[]; forbidden: string[] } {
  const food = currentFood.toLowerCase();
  const match = (list: string[]) =>
    list.filter((k) => k.trim().length >= 2 && food.includes(k.trim().toLowerCase()));
  return {
    allergy: match(allergies),
    forbidden: match(speciesForbidden),
  };
}

export function FoodEditor({ initial, species, onSubmit, loading, onDirtyChange }: Props) {
  const Colors = useColors();
  const { control, handleSubmit, watch, formState: { isDirty } } = useForm<{ currentFood: string; notes: string }>({
    defaultValues: {
      currentFood: initial?.currentFood ?? '',
      notes: initial?.notes ?? '',
    },
  });
  const [allergies, setAllergies] = useState<string[]>(initial?.allergies ?? []);

  // 텍스트 변경 또는 알러지 칩 변경 중 하나라도 있으면 dirty.
  const allergiesDirty = useMemo(
    () => JSON.stringify(allergies) !== JSON.stringify(initial?.allergies ?? []),
    [allergies, initial?.allergies],
  );
  useEffect(() => { onDirtyChange?.(isDirty || allergiesDirty); }, [isDirty, allergiesDirty, onDirtyChange]);
  const speciesForbidden = useMemo(
    () => (species ? DEFAULT_FORBIDDEN_FOODS[species] ?? [] : []),
    [species],
  );
  const currentFoodValue = watch('currentFood') ?? '';

  const conflicts = useMemo(
    () => detectFoodConflicts(currentFoodValue, allergies, speciesForbidden),
    [currentFoodValue, allergies, speciesForbidden],
  );
  const hasConflict = conflicts.allergy.length > 0 || conflicts.forbidden.length > 0;

  // 사용자가 더 이상 forbiddenFoods 를 편집하지 않음 → 빈 배열로 송신해 기존 데이터를 비움.
  // 종별 위험 음식 안내는 /care-guide 페이지에서 제공.
  const handleFormSubmit = (data: { currentFood: string; notes: string }) => {
    onSubmit({ ...data, allergies, forbiddenFoods: [] });
  };

  return (
    <ScrollView className="px-4 py-4" style={{ backgroundColor: Colors.background }}>
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
                위험 성분: <Text style={{ fontWeight: Typography.weight.bold, color: Colors.status.warning }}>{conflicts.forbidden.join(', ')}</Text>
              </Text>
            ) : null}
            <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: 4 }}>
              사료를 바꾸거나 알러지 항목을 다시 확인해주세요.
            </Text>
            {conflicts.forbidden.length > 0 ? (
              <TouchableOpacity
                onPress={() => router.push('/care-guide' as any)}
                hitSlop={Spacing.hitSlop}
                style={{ marginTop: 6, alignSelf: 'flex-start' }}
              >
                <Text
                  style={{
                    ...Typography.preset.caption,
                    color: Colors.primaryDark,
                    fontWeight: Typography.weight.semibold,
                  }}
                >
                  종별 위험 음식 가이드 →
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}

      <View className="mb-4">
        <Text className="text-sm font-medium mb-1" style={{ color: Colors.text.secondary }}>현재 사료</Text>
        <Controller
          control={control}
          name="currentFood"
          render={({ field: { value, onChange } }) => (
            <TextInput
              className="border rounded-xl px-3 py-3"
              style={{
                color: Colors.text.primary,
                borderColor: hasConflict ? Colors.status.error : Colors.border,
              }}
              value={value}
              onChangeText={onChange}
              placeholder="예: 로얄캐닌 인도어"
              placeholderTextColor={Colors.text.disabled}
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

      {/* 종별 공통 위험 음식은 사용자가 펫별로 관리하지 않음 — /care-guide 페이지 안내로 통합. */}
      {species ? (
        <TouchableOpacity
          onPress={() => router.push('/care-guide' as any)}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            padding: Spacing.md,
            borderRadius: Spacing.borderRadius.lg,
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.border,
            marginBottom: Spacing.lg,
          }}
        >
          <Feather name="book-open" size={16} color={Colors.primaryDark} />
          <Text style={{ flex: 1, ...Typography.preset.caption, color: Colors.text.primary }}>
            종별 위험 음식은 초보 집사 가이드에서 확인하세요
          </Text>
          <Feather name="chevron-right" size={16} color={Colors.text.tertiary} />
        </TouchableOpacity>
      ) : null}

      <View className="mb-6">
        <Text className="text-sm font-medium mb-1" style={{ color: Colors.text.secondary }}>메모</Text>
        <Controller
          control={control}
          name="notes"
          render={({ field: { value, onChange } }) => (
            <TextInput
              className="border rounded-xl px-3 py-3"
              style={{ color: Colors.text.primary, borderColor: Colors.border }}
              value={value}
              onChangeText={onChange}
              placeholder="식이 관련 메모"
              placeholderTextColor={Colors.text.disabled}
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
