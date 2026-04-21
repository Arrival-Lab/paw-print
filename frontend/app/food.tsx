import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import PetSelector from '../features/pet/components/PetSelector';
import { FoodEditor } from '../features/food/components/FoodEditor';
import { useFoodInfo, useUpsertFood } from '../features/food/hooks/useFood';
import { Colors, Spacing, Typography } from '../constants';
import type { FoodInfoRequest } from '../features/food/api/foodApi';

export default function FoodScreen() {
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const { data: foodInfo, isLoading } = useFoodInfo(selectedPetId ?? 0);
  const { mutate: upsert, isPending } = useUpsertFood(selectedPetId ?? 0);

  const handleSubmit = (data: FoodInfoRequest) => {
    if (!selectedPetId) return;
    upsert(data);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, marginLeft: Spacing.md, fontSize: Typography.size.lg,
          fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>
          먹이·알러지 정보
        </Text>
      </View>

      {/* 반려동물 선택 */}
      <View style={{ paddingVertical: Spacing.sm }}>
        <PetSelector onPetChange={setSelectedPetId} />
      </View>

      {!selectedPetId ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.text.tertiary, fontSize: Typography.size.sm }}>
            반려동물을 선택해주세요
          </Text>
        </View>
      ) : isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : (
        <FoodEditor initial={foodInfo} onSubmit={handleSubmit} loading={isPending} />
      )}
    </SafeAreaView>
  );
}
