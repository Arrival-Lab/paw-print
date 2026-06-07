import { useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { appointmentApi } from '../../features/appointment/api/appointmentApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
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
import Card from '../../shared/components/Card';
import { useRefresh } from '../../shared/hooks/useRefresh';
import { isDismissedToday, dismissForToday } from '../../shared/utils/storage';
import MonthlyCareGuideModal, { getMonthlyTip } from '../../features/care/components/MonthlyCareGuideModal';
import { useWeatherTip } from '../../features/weather/hooks/useWeatherTip';
import HomeCareTipCard from '../../features/weather/components/HomeCareTipCard';
import SeniorCareCard from '../../features/care/components/SeniorCareCard';
import SymptomCheckCta from '../../features/symptom/components/SymptomCheckCta';
import PetGroupCard from '../../features/home/components/PetGroupCard';
import QuickActionSheet from '../../features/home/components/QuickActionSheet';
import TourTarget from '../../shared/components/TourTarget';
import { TOUR_TARGETS } from '../../shared/store/tourStore';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useUiStore } from '../../shared/store/uiStore';

export default function HomeScreen() {
  const isGuest = useAuthStore((s) => s.isGuest);
  if (isGuest) return <GuestHomeView />;
  return <AuthenticatedHomeView />;
}

function AuthenticatedHomeView() {
  const Colors = useColors();
  const tabBarHeight = useBottomTabBarHeight();
  const [headerHeight, setHeaderHeight] = useState(0);

  const { data: pets = [], isLoading: petsLoading } = usePets();
  const { data: homeCare = [] } = useHomeCare();
  const { data: appointments = [], isPending: appointmentsLoading } = useUpcomingAppointments();
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
  // "오늘 하루 안 보기" — 날짜 저장 기반. 다음날 자동 복귀.
  const [tipDismissed, setTipDismissed] = useState(() => isDismissedToday('home-care-tip'));
  const [seniorDismissed, setSeniorDismissed] = useState(() => isDismissedToday('home-senior'));
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
    return appointments.slice(0, 3);
  }, [appointments]);

  const careMap = useMemo(() => {
    const m = new Map<number, { completed: number; total: number }>();
    for (const hc of homeCare) {
      m.set(hc.petId, { completed: hc.totalCompleted, total: hc.totalTargets });
    }
    return m;
  }, [homeCare]);

  // 오늘(dDay 0) 예약 펫별 개수 — 펫 요약 한 줄의 "일정 N개" 용.
  const todayApptByPet = useMemo(() => {
    const m = new Map<number, number>();
    for (const a of appointments) {
      if (a.dDay === 0) m.set(a.petId, (m.get(a.petId) ?? 0) + 1);
    }
    return m;
  }, [appointments]);

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
        {!tipDismissed ? (
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
              onDismiss={() => { dismissForToday('home-care-tip'); setTipDismissed(true); }}
            />
          </View>
        ) : null}

        {/* 시니어 — 탭하면 해당 펫 상세 시트가 떠서 카드는 slim row OK. */}
        {!seniorDismissed ? (
          <View style={{ marginTop: Spacing.sm }}>
            <SeniorCareCard
              pets={pets}
              compact
              onDismiss={() => { dismissForToday('home-senior'); setSeniorDismissed(true); }}
            />
          </View>
        ) : null}

        {/* AI 증상 1차 체크 — 슬림 row, primary 강조 */}
        <View style={{ marginTop: Spacing.sm }}>
          <SymptomCheckCta />
        </View>

        {/* 펫 그룹 카드 — 화면 메인 (펫별 오늘 한 줄 요약 런처) */}
        <View style={{ marginTop: Spacing.lg }}>
          <PetGroupCard careMap={careMap} todayApptByPet={todayApptByPet} />
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
          {appointmentsLoading ? (
            <View style={{ marginTop: Spacing.md }}>
              <LoadingSpinner inline />
            </View>
          ) : visibleAppointments.length === 0 ? (
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

// 게스트 홈 — 실제로 쓰는 비-계정 기능(날씨/케어팁, 병원 찾기)만 노출 + 로그인 CTA.
// App Store 5.1.1(v) 대응 핵심: "둘러보기 모드"에서 진짜 기능을 쓸 수 있어야 함.
function GuestHomeView() {
  const Colors = useColors();
  const tabBarHeight = useBottomTabBarHeight();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [tipModalOpen, setTipModalOpen] = useState(false);
  const showLoginPrompt = useUiStore((s) => s.showLoginPrompt);
  const weather = useWeatherTip();
  const monthlyTip = useMemo(() => getMonthlyTip(), []);
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

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingTop: headerHeight + Spacing.md,
          paddingBottom: tabBarHeight + Spacing.xxxxl,
        }}
      >
        {/* 1) 날씨/케어 팁 — 위치만 있으면 누구나 볼 수 있음 */}
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

        {/* 2) 병원 찾기 CTA — 비-계정 기능 */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/hospital?mode=nearby')}
          style={{ marginTop: Spacing.lg }}
        >
          <Card variant="elevated" padding="lg">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: Colors.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name="map-pin" size={20} color={Colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary, fontWeight: Typography.weight.semibold }}>
                  동물병원 찾기
                </Text>
                <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                  내 위치 기준 가까운 병원 · 24시 응급
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* 3) 로그인 권유 카드 — 자연스러운 안내, 강요 X */}
        <View style={{ marginTop: Spacing.lg }}>
          <Card variant="tinted" padding="lg">
            <View style={{ alignItems: 'center', gap: Spacing.sm }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: Colors.surfaceElevated,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name="heart" size={26} color={Colors.primaryDark} />
              </View>
              <Text
                style={{
                  ...Typography.preset.title,
                  color: Colors.text.primary,
                  fontWeight: Typography.weight.bold,
                  textAlign: 'center',
                }}
              >
                반려동물 케어를 시작해보세요
              </Text>
              <Text
                style={{
                  ...Typography.preset.bodySmall,
                  color: Colors.text.secondary,
                  textAlign: 'center',
                }}
              >
                로그인하면 진료기록·다이어리·예방접종 알림·가족 공유까지 한 곳에서 관리할 수 있어요
              </Text>
              <TouchableOpacity
                onPress={() => showLoginPrompt('로그인하고 시작하기')}
                activeOpacity={0.85}
                style={{
                  marginTop: Spacing.sm,
                  paddingHorizontal: Spacing.xl,
                  paddingVertical: Spacing.md,
                  borderRadius: Spacing.borderRadius.full,
                  backgroundColor: Colors.primaryDark,
                }}
              >
                <Text style={{ ...Typography.preset.button, color: Colors.white }}>
                  로그인 / 회원가입
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </ScrollView>

      <MonthlyCareGuideModal visible={tipModalOpen} onClose={() => setTipModalOpen(false)} />

      <GlassHeader title="발자국" onHeightChange={setHeaderHeight} />
    </View>
  );
}
