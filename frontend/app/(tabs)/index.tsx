import { useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router, useFocusEffect } from 'expo-router';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import { usePets } from '../../features/pet/hooks/usePets';
import { useHomeCare } from '../../features/care/hooks/useCare';
import { useUpcomingAppointments } from '../../features/appointment/hooks/useAppointments';
import UpcomingAppointmentItem from '../../features/appointment/components/UpcomingAppointmentItem';
import { usePetFilterStore } from '../../shared/store/petFilterStore';
import GlassHeader from '../../shared/components/GlassHeader';
import SectionHeader from '../../shared/components/SectionHeader';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import Fab from '../../shared/components/Fab';
import { useRefresh } from '../../shared/hooks/useRefresh';
import MonthlyCareGuideModal, { getMonthlyTip } from '../../features/care/components/MonthlyCareGuideModal';
import PetGroupCard from '../../features/home/components/PetGroupCard';
import SelectedPetExtras from '../../features/home/components/SelectedPetExtras';
import QuickActionSheet from '../../features/home/components/QuickActionSheet';
import TourTarget from '../../features/onboarding/components/TourTarget';
import { TOUR_TARGETS } from '../../features/onboarding/tourStore';

export default function HomeScreen() {
  const Colors = useColors();
  const tabBarHeight = useBottomTabBarHeight();
  const [headerHeight, setHeaderHeight] = useState(0);
  const selectedPetId = usePetFilterStore((s) => s.selectedPetId);

  // 홈 진입 시 항상 전체 모드로 시작 — 다른 탭에서 펫 선택해두고 돌아와도 reset.
  useFocusEffect(
    useCallback(() => {
      usePetFilterStore.getState().setSelectedPetId(null);
    }, []),
  );

  const { data: pets = [], isLoading: petsLoading } = usePets();
  const { data: homeCare = [] } = useHomeCare();
  const { data: appointments = [] } = useUpcomingAppointments();
  const { refreshing, onRefresh } = useRefresh([
    ['pets'],
    ['care', 'home'],
    ['appointments', 'upcoming'],
  ]);

  const monthlyTip = useMemo(() => getMonthlyTip(), []);
  const [tipModalOpen, setTipModalOpen] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  const visibleAppointments = useMemo(() => {
    const filtered = selectedPetId
      ? appointments.filter((a) => a.petId === selectedPetId)
      : appointments;
    return filtered.slice(0, 3);
  }, [appointments, selectedPetId]);

  const careMap = useMemo(() => {
    const m = new Map<number, { completed: number; total: number }>();
    for (const hc of homeCare) {
      m.set(hc.petId, { completed: hc.totalCompleted, total: hc.totalTargets });
    }
    return m;
  }, [homeCare]);

  if (petsLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }} edges={['top']}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (pets.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.surface }}>
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState
            icon="heart"
            title="반려동물을 등록해주세요"
            description="첫 펫을 등록하면 케어·진료·알림을 시작할 수 있어요"
            action={{ label: '반려동물 등록', onPress: () => router.push('/pets/new') }}
          />
        </View>
        <GlassHeader title="발자국" onHeightChange={setHeaderHeight} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingTop: headerHeight + Spacing.md,
          paddingBottom: tabBarHeight + Spacing.xxxxl,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} progressViewOffset={headerHeight} />}
      >
        {/* 월별팁 */}
        <TouchableOpacity
          onPress={() => setTipModalOpen(true)}
          activeOpacity={0.85}
          style={{
            padding: Spacing.lg,
            backgroundColor: Colors.primaryLight,
            borderRadius: Spacing.borderRadius.lg,
            flexDirection: 'row',
            gap: Spacing.md,
            alignItems: 'flex-start',
            marginTop: Spacing.md,
          }}
        >
          <Image
            source={require('../../assets/heart.png')}
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                ...Typography.preset.caption,
                color: Colors.primaryDark,
                fontWeight: Typography.weight.semibold,
              }}
            >
              {new Date().getMonth() + 1}월의 케어 팁
            </Text>
            <Text
              style={{
                ...Typography.preset.bodyMedium,
                color: Colors.text.primary,
                fontWeight: Typography.weight.semibold,
                marginTop: Spacing.xs,
              }}
            >
              {monthlyTip.title}
            </Text>
            <Text
              style={{
                ...Typography.preset.bodySmall,
                color: Colors.text.secondary,
                marginTop: Spacing.xs,
              }}
            >
              {monthlyTip.body}
            </Text>
            <Text
              style={{
                ...Typography.preset.caption,
                color: Colors.primaryDark,
                fontWeight: Typography.weight.semibold,
                marginTop: Spacing.sm,
              }}
            >
              모든 안내 보기 →
            </Text>
          </View>
        </TouchableOpacity>

        {/* 펫 그룹 카드 (좌상단 필터 overlay + 펫 row들 / 선택 펫 컨텐츠) */}
        <View style={{ marginTop: Spacing.xl }}>
          <PetGroupCard careMap={careMap} />
        </View>

        {/* 다가오는 일정 */}
        <TourTarget tourId={TOUR_TARGETS.HOME_UPCOMING} wrap style={{ marginTop: Spacing.xxl }}>
          <SectionHeader title="다가오는 일정" />
          {visibleAppointments.length === 0 ? (
            <Text
              style={{
                ...Typography.preset.body,
                color: Colors.text.tertiary,
                textAlign: 'center',
                marginTop: Spacing.md,
              }}
            >
              예정된 일정이 없어요
            </Text>
          ) : (
            <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
              {visibleAppointments.map((apt) => (
                <UpcomingAppointmentItem key={apt.id} appointment={apt} />
              ))}
            </View>
          )}
        </TourTarget>

        {/* 펫 선택 시 최근 다이어리·수치·진료 섹션 */}
        {selectedPetId ? <SelectedPetExtras petId={selectedPetId} /> : null}
      </ScrollView>

      {/* 우하단 빠른 액션 FAB */}
      <Fab
        onPress={() => setActionSheetOpen(true)}
        icon="plus"
        accessibilityLabel="빠른 기록 추가"
      />

      {/* 빠른 액션 시트 */}
      <QuickActionSheet
        visible={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        firstPetId={pets[0]?.id ?? null}
        onNavigate={(path) => {
          setActionSheetOpen(false);
          router.push(path as any);
        }}
      />

      {/* 월별팁 상세 모달 */}
      <MonthlyCareGuideModal visible={tipModalOpen} onClose={() => setTipModalOpen(false)} />

      <GlassHeader title="발자국" onHeightChange={setHeaderHeight} />
    </View>
  );
}
