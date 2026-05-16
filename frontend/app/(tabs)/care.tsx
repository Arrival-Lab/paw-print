import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import { usePetFilterStore } from '../../shared/store/petFilterStore';
import { usePets } from '../../features/pet/hooks/usePets';
import ScreenHeader from '../../shared/components/ScreenHeader';
import EmptyState from '../../shared/components/EmptyState';
import PetSelector from '../../features/pet/components/PetSelector';
import { CareTab } from '../../features/care/components/CareTab';
import { FoodEditor } from '../../features/food/components/FoodEditor';
import { useFoodInfo, useUpsertFood } from '../../features/food/hooks/useFood';
import type { FoodInfoRequest } from '../../features/food/api/foodApi';

type SubView = 'check' | 'food';

const SUB: { value: SubView; label: string; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { value: 'check', label: '오늘 체크', icon: 'check-square' },
  { value: 'food', label: '사료·알러지', icon: 'coffee' },
];

export default function CareScreen() {
  const Colors = useColors();
  const selectedPetId = usePetFilterStore((s) => s.selectedPetId);
  const setSelectedPetId = usePetFilterStore((s) => s.setSelectedPetId);
  const { data: pets, isLoading: petsLoading } = usePets();
  const noPets = !petsLoading && (pets?.length ?? 0) === 0;
  const [view, setView] = useState<SubView>('check');

  if (noPets) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }} edges={['top']}>
        <ScreenHeader title="케어" />
        <EmptyState
          icon="check-square"
          title="케어는 펫 등록 후 시작해요"
          description="사료·간식·영양제·산책 등 매일 챙길 일을 체크리스트로 관리해요"
          action={{ label: '반려동물 등록', onPress: () => router.push('/pets/new') }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }} edges={['top']}>
      <ScreenHeader title="케어" />

      <View style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}>
        <PetSelector onPetChange={setSelectedPetId} includeAll={false} />
      </View>

      {/* 서브 탭 */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: Spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        {SUB.map((s) => {
          const active = view === s.value;
          return (
            <TouchableOpacity
              key={s.value}
              onPress={() => setView(s.value)}
              activeOpacity={0.7}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: Spacing.md,
                borderBottomWidth: 2,
                borderBottomColor: active ? Colors.primary : 'transparent',
              }}
            >
              <Feather name={s.icon} size={16} color={active ? Colors.primary : Colors.text.tertiary} />
              <Text
                style={{
                  ...Typography.preset.caption,
                  fontWeight: Typography.weight.semibold,
                  color: active ? Colors.primary : Colors.text.tertiary,
                  marginTop: 2,
                }}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {view === 'check' ? (
        <CareTab selectedPetId={selectedPetId} />
      ) : (
        <FoodView selectedPetId={selectedPetId} />
      )}
    </SafeAreaView>
  );
}

function FoodView({ selectedPetId }: { selectedPetId: number | null }) {
  const { data: foodInfo, isLoading } = useFoodInfo(selectedPetId ?? 0);
  const { mutate: upsert, isPending } = useUpsertFood(selectedPetId ?? 0);

  if (!selectedPetId) {
    return (
      <EmptyState
        icon="coffee"
        title="펫을 선택해주세요"
        description="사료·알러지 정보는 펫별로 관리해요"
      />
    );
  }
  if (isLoading) return null;
  return (
    <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }}>
      <FoodEditor initial={foodInfo} onSubmit={(data: FoodInfoRequest) => upsert(data)} loading={isPending} />
    </ScrollView>
  );
}
