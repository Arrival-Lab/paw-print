import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../shared/components/ScreenHeader';
import PetSelector from '../../features/pet/components/PetSelector';
import { useColors } from '../../shared/hooks/useTheme';
import { AppointmentsTab, AllAppointmentsTab } from '../../features/appointment/components/AppointmentsTab';

/**
 * 진료일정 풀리스트 — 진료 통합 탭의 "전체보기" 도착지. 기존 AppointmentsTab/AllAppointmentsTab 재활용.
 */
export default function AllAppointmentsScreen() {
  const Colors = useColors();
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Colors.surface }}>
      <ScreenHeader title="진료일정 전체" back>
        <PetSelector
          onPetChange={setSelectedPetId}
          includeAll
          paddingHorizontal={0}
          paddingVertical={0}
        />
      </ScreenHeader>
      <View style={{ flex: 1 }}>
        {selectedPetId === null ? (
          <AllAppointmentsTab />
        ) : (
          <AppointmentsTab selectedPetId={selectedPetId} />
        )}
      </View>
    </SafeAreaView>
  );
}
