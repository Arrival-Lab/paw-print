import { useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { appointmentApi } from '../../features/appointment/api/appointmentApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import { usePets } from '../../features/pet/hooks/usePets';
import { useHomeCare } from '../../features/care/hooks/useCare';
import { useUpcomingAppointments } from '../../features/appointment/hooks/useAppointments';
import UpcomingAppointmentItem from '../../features/appointment/components/UpcomingAppointmentItem';
import AppointmentDetailSheet from '../../features/appointment/components/AppointmentDetailSheet';
import GlassHeader from '../../shared/components/GlassHeader';
import SectionHeader from '../../shared/components/SectionHeader';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import Fab from '../../shared/components/Fab';
import { useRefresh } from '../../shared/hooks/useRefresh';
import MonthlyCareGuideModal, { getMonthlyTip } from '../../features/care/components/MonthlyCareGuideModal';
import { useWeatherTip } from '../../features/weather/hooks/useWeatherTip';
import HomeCareTipCard from '../../features/weather/components/HomeCareTipCard';
import SeniorCareCard from '../../features/care/components/SeniorCareCard';
import SymptomCheckCta from '../../features/symptom/components/SymptomCheckCta';
import PetGroupCard from '../../features/home/components/PetGroupCard';
import QuickActionSheet from '../../features/home/components/QuickActionSheet';
import TourTarget from '../../features/onboarding/components/TourTarget';
import { TOUR_TARGETS } from '../../features/onboarding/tourStore';

export default function HomeScreen() {
  const Colors = useColors();
  const tabBarHeight = useBottomTabBarHeight();
  const [headerHeight, setHeaderHeight] = useState(0);

  const { data: pets = [], isLoading: petsLoading } = usePets();
  const { data: homeCare = [] } = useHomeCare();
  const { data: appointments = [] } = useUpcomingAppointments();
  const { refreshing, onRefresh } = useRefresh([
    ['pets'],
    ['care', 'home'],
    ['appointments', 'upcoming'],
  ]);

  const monthlyTip = useMemo(() => getMonthlyTip(), []);
  const weather = useWeatherTip();
  // 날씨 트리거 발동 시 weather 팁, 아니면 월별 팁 폴백
  const tipCard = weather.tip
    ? {
        trigger: weather.trigger,
        headerLabel: weather.label ?? '오늘의 케어',
        icon: weather.tip.icon,
        title: weather.tip.title,
        body: weather.tip.body,
        caution: weather.tip.caution,
      }
    : {
        trigger: 'NONE' as const,
        headerLabel: `${new Date().getMonth() + 1}월의 케어 팁`,
        icon: monthlyTip.icon,
        title: monthlyTip.title,
        body: monthlyTip.body,
        caution: undefined,
      };
  const [tipModalOpen, setTipModalOpen] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [appointmentDetail, setAppointmentDetail] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const handleDeleteAppointment = (id: number, petId: number) => {
    Alert.alert('예약 삭제', '이 예약을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          setAppointmentDetail(null);
          try {
            await appointmentApi.delete(petId, id);
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
          } catch (e: any) {
            Alert.alert('삭제 실패', e?.response?.data?.message ?? '잠시 후 다시 시도해주세요.');
          }
        },
      },
    ]);
  };

  const visibleAppointments = useMemo(() => {
    return (appointments as unknown as Array<{ petId: number }>).slice(0, 3);
  }, [appointments]);

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
        {/* 케어 팁 카드 — trigger 별 색·날씨 칩·본문·caution 다 카드 안에서 완결.
            탭하면 월별 전체 가이드 모달(상세가 아닌 리스트)이라 카드 자체에 정보가 다 들어가야 함. */}
        <View style={{ marginTop: Spacing.md }}>
          <HomeCareTipCard
            trigger={tipCard.trigger}
            headerLabel={tipCard.headerLabel}
            icon={tipCard.icon}
            title={tipCard.title}
            body={tipCard.body}
            caution={tipCard.caution}
            weather={weather.weather}
            onPress={() => setTipModalOpen(true)}
          />
        </View>

        {/* 시니어 — 탭하면 해당 펫 상세 시트가 떠서 카드는 slim row OK. */}
        <View style={{ marginTop: Spacing.sm }}>
          <SeniorCareCard pets={pets} compact />
        </View>

        {/* AI 증상 1차 체크 — 슬림 row, primary 강조 */}
        <View style={{ marginTop: Spacing.sm }}>
          <SymptomCheckCta />
        </View>

        {/* 펫 그룹 카드 — 화면 메인 */}
        <View style={{ marginTop: Spacing.lg }}>
          <PetGroupCard careMap={careMap} />
        </View>

        {/* 다가오는 일정 */}
        <TourTarget tourId={TOUR_TARGETS.HOME_UPCOMING} wrap style={{ marginTop: Spacing.lg }}>
          <SectionHeader
            title="다가오는 일정"
            action={{
              label: '전체 보기',
              onPress: () => router.push('/appointments/all' as any),
            }}
          />
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
                <UpcomingAppointmentItem
                  key={apt.id}
                  appointment={apt}
                  onPress={() => setAppointmentDetail(apt)}
                />
              ))}
            </View>
          )}
        </TourTarget>

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

      {/* 다가오는 일정 상세 시트 — 진료 탭과 공통 컴포넌트 재사용 */}
      <AppointmentDetailSheet
        appointment={appointmentDetail}
        onClose={() => setAppointmentDetail(null)}
        onDelete={() => {
          if (!appointmentDetail) return;
          handleDeleteAppointment(appointmentDetail.id, appointmentDetail.petId);
        }}
      />

      <GlassHeader title="발자국" onHeightChange={setHeaderHeight} />
    </View>
  );
}
