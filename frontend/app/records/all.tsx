import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../shared/components/ScreenHeader';
import PetSelector from '../../features/pet/components/PetSelector';
import { useColors } from '../../shared/hooks/useTheme';
import { RecordsTab, AllRecordsTab } from '../../features/record/components/RecordsTab';

/**
 * 진료기록 풀리스트 — 진료 통합 탭의 "전체보기" 도착지. 기존 RecordsTab/AllRecordsTab 재활용.
 */
export default function AllRecordsScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Colors.surface }}>
      <ScreenHeader title={t('record.allTitle')} back>
        <PetSelector
          onPetChange={setSelectedPetId}
          includeAll
          paddingHorizontal={0}
          paddingVertical={0}
        />
      </ScreenHeader>
      <View style={{ flex: 1 }}>
        {selectedPetId === null ? <AllRecordsTab /> : <RecordsTab selectedPetId={selectedPetId} />}
      </View>
    </SafeAreaView>
  );
}
