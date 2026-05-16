import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Spacing } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import { usePetFilterStore } from '../../shared/store/petFilterStore';
import { usePets } from '../../features/pet/hooks/usePets';
import ScreenHeader from '../../shared/components/ScreenHeader';
import EmptyState from '../../shared/components/EmptyState';
import PetSelector from '../../features/pet/components/PetSelector';
import { CareTab } from '../../features/care/components/CareTab';

export default function CareScreen() {
  const Colors = useColors();
  const selectedPetId = usePetFilterStore((s) => s.selectedPetId);
  const setSelectedPetId = usePetFilterStore((s) => s.setSelectedPetId);
  const { data: pets, isLoading: petsLoading } = usePets();
  const noPets = !petsLoading && (pets?.length ?? 0) === 0;

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
      <CareTab selectedPetId={selectedPetId} />
    </SafeAreaView>
  );
}
