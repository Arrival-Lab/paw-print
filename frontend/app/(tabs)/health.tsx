import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import GlassHeader from '../../shared/components/GlassHeader';
import EmptyState from '../../shared/components/EmptyState';
import PetSelector from '../../features/pet/components/PetSelector';
import TourTarget from '../../features/onboarding/components/TourTarget';
import { TOUR_TARGETS } from '../../features/onboarding/tourStore';
import { MedicalTab, AllMedicalTab } from '../../features/medical/components/MedicalTab';
import { VaccinesTab } from '../../features/vaccine/components/VaccinesTab';
import { usePets } from '../../features/pet/hooks/usePets';
import { usePetFilterStore } from '../../shared/store/petFilterStore';

type SubTab = 'medical' | 'vaccines';

const SUB_TABS: { label: string; value: SubTab; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { label: '진료', value: 'medical', icon: 'heart' },
  { label: '백신', value: 'vaccines', icon: 'shield' },
];

export default function HealthScreen() {
  const Colors = useColors();
  const tabBarHeight = useBottomTabBarHeight();
  const [headerHeight, setHeaderHeight] = useState(0);
  const params = useLocalSearchParams<{ tab?: string }>();
  const resolveTab = (raw: string | undefined): SubTab | null => {
    if (!raw) return null;
    if (SUB_TABS.some((t) => t.value === raw)) return raw as SubTab;
    return null;
  };
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<SubTab>(resolveTab(params.tab) ?? 'medical');
  const setSelectedPetIdStore = usePetFilterStore((s) => s.setSelectedPetId);
  const { data: pets, isLoading: petsLoading } = usePets();
  const noPets = !petsLoading && (pets?.length ?? 0) === 0;

  useEffect(() => {
    const next = resolveTab(params.tab);
    if (next) setActiveTab(next);
  }, [params.tab]);

  useEffect(() => {
    if (selectedPetId !== null) setSelectedPetIdStore(selectedPetId);
  }, [selectedPetId, setSelectedPetIdStore]);

  if (noPets) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.surface }}>
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState
            icon="heart"
            title="건강 기록은 펫 등록 후 시작해요"
            description="진료기록과 예방접종을 한 곳에서 관리해요"
            action={{ label: '반려동물 등록', onPress: () => router.push('/pets/new') }}
          />
        </View>
        <GlassHeader title="건강" onHeightChange={setHeaderHeight} />
      </View>
    );
  }

  // '진료' 만 "전체" 모드 지원. '백신' 은 펫별만 의미 있음 → 펫 미선택 시 안내.
  const includeAllPets = activeTab === 'medical';

  const subTabBar = (
    <TourTarget
      tourId={TOUR_TARGETS.TAB_HEALTH}
      wrap
      style={{
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.sm,
      }}
    >
      {SUB_TABS.map((tab) => {
        const active = activeTab === tab.value;
        return (
          <TouchableOpacity
            key={tab.value}
            onPress={() => setActiveTab(tab.value)}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: Spacing.md,
            }}
          >
            <Feather name={tab.icon} size={18} color={active ? Colors.primary : Colors.text.tertiary} />
            <Text
              style={{
                ...Typography.preset.caption,
                fontWeight: Typography.weight.semibold,
                color: active ? Colors.primary : Colors.text.tertiary,
                marginTop: 4,
              }}
            >
              {tab.label}
            </Text>
            {active ? (
              <View
                style={{
                  position: 'absolute',
                  bottom: -1,
                  width: 24,
                  height: 3,
                  backgroundColor: Colors.primary,
                  borderRadius: 2,
                }}
              />
            ) : null}
          </TouchableOpacity>
        );
      })}
    </TourTarget>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      <View style={{ flex: 1, paddingBottom: tabBarHeight }}>
        {selectedPetId === null && activeTab === 'medical' ? (
          <AllMedicalTab topInset={headerHeight} />
        ) : selectedPetId === null ? (
          <View style={{ flex: 1, paddingTop: headerHeight }}>
            <EmptyState
              icon="shield"
              title="펫을 선택해주세요"
              description="예방접종은 펫별로 관리해요. 상단에서 펫을 선택하세요"
              tone="muted"
            />
          </View>
        ) : (
          <>
            {activeTab === 'medical' && <MedicalTab selectedPetId={selectedPetId} topInset={headerHeight} />}
            {activeTab === 'vaccines' && <VaccinesTab selectedPetId={selectedPetId} topInset={headerHeight} />}
          </>
        )}
      </View>

      <GlassHeader title="건강" onHeightChange={setHeaderHeight} bottomSlot={subTabBar}>
        <PetSelector
          onPetChange={setSelectedPetId}
          includeAll={includeAllPets}
          paddingHorizontal={0}
          paddingVertical={0}
        />
      </GlassHeader>
    </View>
  );
}
