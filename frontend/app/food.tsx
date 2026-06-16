import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PetSelector from '../features/pet/components/PetSelector';
import { FoodEditor } from '../features/food/components/FoodEditor';
import { useFoodInfo, useUpsertFood } from '../features/food/hooks/useFood';
import { usePet } from '../features/pet/hooks/usePets';
import { Spacing } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import ScreenHeader from '../shared/components/ScreenHeader';
import EmptyState from '../shared/components/EmptyState';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import type { FoodInfo, FoodInfoRequest } from '../features/food/api/foodApi';
import type { Pet } from '../features/pet/api/petApi';

export default function FoodScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const { data: foodInfo, isLoading } = useFoodInfo(selectedPetId ?? 0);
  const { data: pet } = usePet(selectedPetId ?? 0);
  const { mutate: upsert, isPending } = useUpsertFood(selectedPetId ?? 0);

  // 종별 위험 음식은 /care-guide 가이드 페이지로 분리됨 — 펫별 prefill 불필요.
  const initialFood = (foodInfo as unknown as FoodInfo | null | undefined) ?? null;
  const species = (pet as unknown as { species?: Pet['species'] } | undefined)?.species;

  const handleSubmit = (data: FoodInfoRequest) => {
    if (!selectedPetId) return;
    upsert(data);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader title={t('food.title')} back />

      <View style={{ paddingVertical: Spacing.sm }}>
        <PetSelector onPetChange={setSelectedPetId} />
      </View>

      {!selectedPetId ? (
        <EmptyState icon="heart" title={t('appointment.selectPet')} tone="muted" />
      ) : isLoading ? (
        <LoadingSpinner label={t('common.loading')} />
      ) : (
        <FoodEditor initial={initialFood} species={species} onSubmit={handleSubmit} loading={isPending} />
      )}
    </SafeAreaView>
  );
}
