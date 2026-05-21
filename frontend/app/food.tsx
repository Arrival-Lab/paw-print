import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PetSelector from '../features/pet/components/PetSelector';
import { FoodEditor } from '../features/food/components/FoodEditor';
import { useFoodInfo, useUpsertFood } from '../features/food/hooks/useFood';
import { usePet } from '../features/pet/hooks/usePets';
import { DEFAULT_FORBIDDEN_FOODS } from '../features/food/constants/defaultForbiddenFoods';
import { Spacing } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import ScreenHeader from '../shared/components/ScreenHeader';
import EmptyState from '../shared/components/EmptyState';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import type { FoodInfo, FoodInfoRequest } from '../features/food/api/foodApi';
import type { Pet } from '../features/pet/api/petApi';

export default function FoodScreen() {
  const Colors = useColors();
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const { data: foodInfo, isLoading } = useFoodInfo(selectedPetId ?? 0);
  const { data: pet } = usePet(selectedPetId ?? 0);
  const { mutate: upsert, isPending } = useUpsertFood(selectedPetId ?? 0);

  // FoodInfo 가 아예 없거나 forbiddenFoods 가 비었으면 species 별 default 로 prefill.
  // 사용자는 추가/제거 후 저장 가능 — 저장하기 전엔 DB 에 반영 안 됨.
  const effectiveInitial = useMemo<FoodInfo | null>(() => {
    // axios 응답 추론 이슈 우회 — 런타임은 unwrap 된 데이터.
    const food = foodInfo as unknown as FoodInfo | null | undefined;
    const petData = pet as unknown as { species?: Pet['species'] } | undefined;
    if (!petData?.species) return food ?? null;
    const defaults = DEFAULT_FORBIDDEN_FOODS[petData.species] ?? [];
    if (food == null) {
      return {
        id: 0,
        currentFood: null,
        allergies: [],
        forbiddenFoods: defaults,
        notes: null,
        updatedAt: '',
      };
    }
    if ((food.forbiddenFoods?.length ?? 0) === 0 && defaults.length > 0) {
      return { ...food, forbiddenFoods: defaults };
    }
    return food;
  }, [foodInfo, pet]);

  const handleSubmit = (data: FoodInfoRequest) => {
    if (!selectedPetId) return;
    upsert(data);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader title="먹이·알러지 정보" back />

      <View style={{ paddingVertical: Spacing.sm }}>
        <PetSelector onPetChange={setSelectedPetId} />
      </View>

      {!selectedPetId ? (
        <EmptyState icon="heart" title="반려동물을 선택해주세요" tone="muted" />
      ) : isLoading ? (
        <LoadingSpinner label="불러오는 중" />
      ) : (
        <FoodEditor initial={effectiveInitial} onSubmit={handleSubmit} loading={isPending} />
      )}
    </SafeAreaView>
  );
}
