import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import GlassHeader from '../../shared/components/GlassHeader';
import EmptyState from '../../shared/components/EmptyState';
import PetSelector from '../../features/pet/components/PetSelector';
import TourTarget from '../../shared/components/TourTarget';
import { TOUR_TARGETS } from '../../shared/store/tourStore';
import GuestTabGate from '../../shared/components/GuestTabGate';
import { CareTab } from '../../features/care/components/CareTab';
import { MetricsTab } from '../../features/metric/components/MetricsTab';
import { VaccinesTab } from '../../features/vaccine/components/VaccinesTab';
import { usePets } from '../../features/pet/hooks/usePets';
import { useAuthStore } from '../../features/auth/store/authStore';
import { usePetFilterStore } from '../../shared/store/petFilterStore';

type SubTab = 'daily-check' | 'recurring' | 'metrics';

const SUB_TABS: { labelKey: string; value: SubTab; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { labelKey: 'daily.subDailyCheck', value: 'daily-check', icon: 'check-square' },
  { labelKey: 'daily.subRecurring', value: 'recurring', icon: 'repeat' },
  { labelKey: 'daily.subMetrics', value: 'metrics', icon: 'trending-up' },
];

const EMPTY_BY_TAB: Record<SubTab, { icon: React.ComponentProps<typeof Feather>['name']; descKey: string }> = {
  'daily-check': { icon: 'check-square', descKey: 'daily.emptyDailyCheck' },
  recurring: { icon: 'repeat', descKey: 'daily.emptyRecurring' },
  metrics: { icon: 'trending-up', descKey: 'daily.emptyMetrics' },
};

export default function DailyScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const tabBarHeight = useBottomTabBarHeight();
  const [headerHeight, setHeaderHeight] = useState(0);
  const params = useLocalSearchParams<{ tab?: string }>();
  const resolveTab = (raw: string | undefined): SubTab | null => {
    if (!raw) return null;
    if (SUB_TABS.some((t) => t.value === raw)) return raw as SubTab;
    return null;
  };
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<SubTab>(resolveTab(params.tab) ?? 'daily-check');
  const setSelectedPetIdStore = usePetFilterStore((s) => s.setSelectedPetId);
  const isGuest = useAuthStore((s) => s.isGuest);
  const { data: pets, isLoading: petsLoading } = usePets();
  const noPets = !petsLoading && (pets?.length ?? 0) === 0;

  useEffect(() => {
    const next = resolveTab(params.tab);
    if (next) setActiveTab(next);
  }, [params.tab]);

  useEffect(() => {
    if (selectedPetId !== null) setSelectedPetIdStore(selectedPetId);
  }, [selectedPetId, setSelectedPetIdStore]);

  // 탭 진입 시 펫 필터 reset — 다른 탭에서 선택한 펫이 그대로 따라오면 헷갈린다는 피드백.
  // includeAll=false 인 PetSelector 는 null 직후 useEffect 에서 첫 펫 자동 선택.
  useFocusEffect(
    useCallback(() => {
      setSelectedPetIdStore(null);
    }, [setSelectedPetIdStore]),
  );

  if (isGuest) {
    return (
      <GuestTabGate
        tabTitle={t('nav.daily')}
        icon="check-square"
        title={t('daily.guestTitle')}
        description={t('daily.guestDesc')}
        loginPromptMessage={t('daily.guestLoginPrompt')}
      />
    );
  }

  if (noPets) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.surface }}>
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState
            icon="check-square"
            title={t('daily.noPetsTitle')}
            description={t('daily.noPetsDesc')}
            action={{ label: t('home.registerPet'), onPress: () => router.push('/pets/new') }}
          />
        </View>
        <GlassHeader title={t('nav.daily')} onHeightChange={setHeaderHeight} />
      </View>
    );
  }

  const subTabBar = (
    <TourTarget
      tourId={TOUR_TARGETS.TAB_DAILY}
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
              {t(tab.labelKey)}
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
        {selectedPetId === null ? (
          <View style={{ flex: 1, paddingTop: headerHeight }}>
            <EmptyState
              icon={EMPTY_BY_TAB[activeTab].icon}
              title={t('common.selectPet')}
              description={t(EMPTY_BY_TAB[activeTab].descKey)}
              tone="muted"
            />
          </View>
        ) : (
          <>
            {activeTab === 'daily-check' && <CareTab selectedPetId={selectedPetId} topInset={headerHeight} />}
            {activeTab === 'recurring' && <VaccinesTab selectedPetId={selectedPetId} category="RECURRING" topInset={headerHeight} />}
            {activeTab === 'metrics' && <MetricsTab selectedPetId={selectedPetId} topInset={headerHeight} />}
          </>
        )}
      </View>

      <GlassHeader title={t('nav.daily')} onHeightChange={setHeaderHeight} bottomSlot={subTabBar}>
        <PetSelector
          onPetChange={setSelectedPetId}
          includeAll={false}
          paddingHorizontal={0}
          paddingVertical={0}
        />
      </GlassHeader>
    </View>
  );
}
