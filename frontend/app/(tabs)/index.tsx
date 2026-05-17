import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, Modal, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Typography, Spacing, Config, Elevation } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import { useAuthStore } from '../../features/auth/store/authStore';
import { usePets } from '../../features/pet/hooks/usePets';
import { useUiStore } from '../../shared/store/uiStore';
import { vaccineApi, type VaccineWithPet } from '../../features/vaccine/api/vaccineApi';
import { useUpcomingAppointments } from '../../features/appointment/hooks/useAppointments';
import UpcomingAppointmentItem from '../../features/appointment/components/UpcomingAppointmentItem';
import { useWeeklyStats } from '../../features/home/hooks/useWeeklyStats';
import { useHomeCare } from '../../features/care/hooks/useCare';
import { usePetFilterStore } from '../../shared/store/petFilterStore';
import {
  useOnboardingStep, useOnboardingDismiss, getStepMeta,
} from '../../features/home/hooks/useOnboarding';
import type { HomeCare } from '../../features/care/api/careApi';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import Badge from '../../shared/components/Badge';
import Fab from '../../shared/components/Fab';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ScreenHeader from '../../shared/components/ScreenHeader';
import PremiumLock from '../../shared/components/PremiumLock';
import { useRefresh } from '../../shared/hooks/useRefresh';
import TourTarget from '../../features/onboarding/components/TourTarget';
import { TOUR_TARGETS } from '../../features/onboarding/tourStore';
import MonthlyCareGuideModal, { getMonthlyTip } from '../../features/care/components/MonthlyCareGuideModal';

const SPECIES_LABEL: Record<string, string> = {
  DOG: '강아지',
  CAT: '고양이',
  BIRD: '새',
  REPTILE: '파충류',
  SMALL_ANIMAL: '소동물',
  OTHER: '기타',
};

const SPECIES_PAW: Record<string, any> = {
  DOG: require('../../assets/paws/dog.png'),
  CAT: require('../../assets/paws/cat.png'),
  BIRD: require('../../assets/paws/bird.png'),
  REPTILE: require('../../assets/paws/reptile.png'),
  SMALL_ANIMAL: require('../../assets/paws/small.png'),
  OTHER: require('../../assets/paws/other.png'),
};

// species 별 ring 컬러 없이 한 톤으로 통일 — 사진/일러스트 자체가 시각 차별점.
function speciesRingTone(_species: string, Colors: ReturnType<typeof useColors>): string {
  return Colors.surface;
}

function ageFromBirthDate(birth: string | null): string | null {
  if (!birth) return null;
  const b = new Date(birth);
  const now = new Date();
  let years = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) years -= 1;
  if (years < 1) {
    const months = (now.getFullYear() - b.getFullYear()) * 12 + m;
    return `${Math.max(months, 0)}개월`;
  }
  return `${years}살`;
}

function InitialAvatar({ name, size, species }: { name: string; size: number; species?: string }) {
  const Colors = useColors();
  const paw = species ? SPECIES_PAW[species] ?? SPECIES_PAW.OTHER : undefined;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {paw ? (
        <Image source={paw} style={{ width: size * 0.62, height: size * 0.62 }} resizeMode="contain" />
      ) : (
        <Text style={{ fontSize: size / 2.4, fontWeight: Typography.weight.bold, color: Colors.primary }}>
          {name.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const Colors = useColors();
  const user = useAuthStore((s) => s.user);
  const { data: pets, isLoading: petsLoading } = usePets();
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [seasonTipDismissed, setSeasonTipDismissed] = useState(false);

  const isFree = user?.subscriptionType === 'FREE';

  const { data: upcomingAll } = useQuery({
    queryKey: ['vaccines', 'upcoming', 30],
    queryFn: () => vaccineApi.getUpcoming(30),
    enabled: !!pets?.length,
    staleTime: 60_000,
  });

  const upcomingVaccines = useMemo(
    () => (upcomingAll ?? []).slice(0, 3),
    [upcomingAll],
  );

  const { data: upcomingAppointmentsAll } = useUpcomingAppointments(30);
  const upcomingAppointments = useMemo(
    () => ((upcomingAppointmentsAll as unknown as any[]) ?? []).slice(0, 3),
    [upcomingAppointmentsAll],
  );

  const { data: homeCare } = useHomeCare();

  // 온보딩 — 펫 1마리일 때만, dismiss 안 했고 단계 남아있을 때 노출
  const firstPet = pets?.[0];
  const onboardingStep = useOnboardingStep((pets?.length ?? 0) === 1 ? firstPet?.id : null);
  const { dismissed: onboardingDismissed, dismiss: dismissOnboarding } = useOnboardingDismiss();
  const showOnboarding = !onboardingDismissed && onboardingStep !== null && (pets?.length ?? 0) === 1;

  const handleAddPet = () => {
    if (isFree && (pets?.length ?? 0) >= Config.freeMaxPets) {
      showPremiumModal(`무료 플랜은 반려동물을 최대 ${Config.freeMaxPets}마리까지 등록할 수 있어요.`);
      return;
    }
    router.push('/pets/new');
  };

  const { refreshing, onRefresh } = useRefresh([
    ['pets'],
    ['vaccines'],
    ['care'],
    ['diary-list'],
    ['records'],
    ['metric-chart'],
  ]);

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  const hasPets = (pets?.length ?? 0) > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }} edges={['top']}>
      <ScreenHeader title="홈" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: Spacing.xxxxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
      >
        {/* 1. 시즌 팁 — 맨 위 (x 로 dismiss 가능하므로 위치는 위가 적절) */}
        {seasonTipDismissed ? null : (
          <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }}>
            <SeasonalTipCard onDismiss={() => setSeasonTipDismissed(true)} />
          </View>
        )}

        {/* 2. 온보딩 — 첫 펫 등록 후 단계적 가이드 */}
        {showOnboarding && onboardingStep ? (
          <OnboardingCard
            step={onboardingStep}
            onDismiss={dismissOnboarding}
          />
        ) : null}

        {!petsLoading && !hasPets ? (
          <EmptyHero onAddPet={handleAddPet} />
        ) : (
          <>
            {/* 3. 펫 strip — 섹션 헤더 없이 압축, count 는 카운트 칩으로 */}
            <View style={{ marginTop: Spacing.md }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.md }}
              >
                {(pets ?? []).map((pet) => (
                  <PetCard
                    key={pet.id}
                    pet={pet}
                    onPress={() =>
                      router.push({ pathname: '/pets/[id]', params: { id: pet.id } })
                    }
                  />
                ))}
                <AddPetTile
                  onPress={handleAddPet}
                  locked={isFree && (pets?.length ?? 0) >= Config.freeMaxPets}
                />
              </ScrollView>
              {isFree ? (
                <Text
                  style={{
                    ...Typography.preset.caption,
                    color: Colors.text.tertiary,
                    paddingHorizontal: Spacing.lg,
                    marginTop: Spacing.xs,
                  }}
                >
                  {pets?.length ?? 0} / {Config.freeMaxPets}마리
                </Text>
              ) : null}
            </View>

            {/* 4. 오늘 — vaccines + appointments + care 통합 1섹션 (행동 우선) */}
            {(upcomingVaccines.length > 0 || upcomingAppointments.length > 0 || (homeCare ?? []).length > 0) ? (
              <TourTarget tourId={TOUR_TARGETS.HOME_CARE} wrap>
                <Section
                  title="오늘"
                  accent={upcomingVaccines.length > 0 || upcomingAppointments.length > 0}
                  right={
                    (homeCare ?? []).length > 0 ? (
                      <TouchableOpacity
                        onPress={() => router.push({ pathname: '/(tabs)/records', params: { tab: 'daily' } })}
                        hitSlop={Spacing.hitSlop}
                      >
                        <Text style={{ ...Typography.preset.caption, color: Colors.primaryDark, fontWeight: Typography.weight.semibold }}>
                          케어 관리
                        </Text>
                      </TouchableOpacity>
                    ) : null
                  }
                >
                  <View style={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm }}>
                    {upcomingAppointments.map((a: any) => (
                      <UpcomingAppointmentItem key={`appt-${a.petId}-${a.id}`} appointment={a} />
                    ))}
                    {upcomingVaccines.map((v) => (
                      <UpcomingItem key={`${v.petId}-${v.id}`} vaccine={v} />
                    ))}
                    {(homeCare ?? []).map((c) => (
                      <HomeCareCard key={c.petId} care={c} multi={(pets?.length ?? 0) > 1} />
                    ))}
                  </View>
                </Section>
              </TourTarget>
            ) : null}

            {/* 5. 이번 주 — 모든 펫 합산 1카드 */}
            <Section title="이번 주">
              <View style={{ paddingHorizontal: Spacing.lg }}>
                <WeeklySummaryCard />
              </View>
            </Section>
          </>
        )}
      </ScrollView>

      {hasPets ? (
        <Fab
          onPress={() => setShowActionSheet(true)}
          icon="plus"
          accessibilityLabel="빠른 기록 추가"
        />
      ) : null}

      <QuickActionSheet
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        firstPetId={((pets as unknown as any[]) ?? [])[0]?.id ?? null}
        onNavigate={(path) => {
          setShowActionSheet(false);
          router.push(path as any);
        }}
      />
    </SafeAreaView>
  );
}

function QuickActionSheet({
  visible,
  onClose,
  onNavigate,
  firstPetId,
}: {
  visible: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  firstPetId: number | null;
}) {
  const Colors = useColors();
  const apptPath = firstPetId ? `/appointments/new?petId=${firstPetId}` : '/(tabs)';
  const actions = [
    { icon: 'edit-3' as const, label: '다이어리 메모', desc: '오늘 하루 자유롭게', path: '/diary', accent: false },
    { icon: 'file-text' as const, label: '진료기록', desc: '병원 방문·처방전 사진', path: '/records', accent: false },
    { icon: 'calendar' as const, label: '병원 예약 추가', desc: '다음 방문 일정 + 알림', path: apptPath, accent: false },
    { icon: 'shield' as const, label: '예방접종 등록', desc: '다음 접종일 자동 알림', path: '/records', accent: false },
    { icon: 'plus-square' as const, label: '응급/24시 병원 찾기', desc: '내 위치 기준 가까운 곳', path: '/hospital', accent: true },
  ];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: Colors.overlay }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            marginTop: 'auto',
            backgroundColor: Colors.surfaceElevated,
            borderTopLeftRadius: Spacing.borderRadius.xxl,
            borderTopRightRadius: Spacing.borderRadius.xxl,
            paddingHorizontal: Spacing.lg,
            paddingTop: Spacing.lg,
            paddingBottom: Spacing.xxxl,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.border,
              marginBottom: Spacing.lg,
            }}
          />
          <Text style={{ ...Typography.preset.h3, color: Colors.text.primary, marginBottom: Spacing.lg }}>
            무엇을 기록할까요?
          </Text>
          {actions.map((a) => (
            <TouchableOpacity
              key={a.label}
              onPress={() => onNavigate(a.path)}
              activeOpacity={0.85}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.md,
                paddingVertical: Spacing.md,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: a.accent ? Colors.status.errorBg : Colors.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name={a.icon} size={20} color={a.accent ? Colors.status.error : Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...Typography.preset.body, color: a.accent ? Colors.status.error : Colors.text.primary, fontWeight: Typography.weight.semibold }}>
                  {a.label}
                </Text>
                <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                  {a.desc}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Section({
  title, right, caption, accent, children,
}: {
  title: string;
  right?: React.ReactNode;
  caption?: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  const Colors = useColors();
  return (
    <View style={{ marginTop: Spacing.lg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: Spacing.lg,
          marginBottom: Spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm }}>
          {accent ? (
            <View
              style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.status.warning, alignSelf: 'center' }}
            />
          ) : null}
          <Text style={{ ...Typography.preset.title, color: Colors.text.primary }}>{title}</Text>
          {caption ? (
            <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>· {caption}</Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

function EmptyHero({ onAddPet }: { onAddPet: () => void }) {
  const Colors = useColors();
  return (
    <View
      style={{
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.xl,
        padding: Spacing.xxl,
        borderRadius: Spacing.borderRadius.xl,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: Colors.white,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: Spacing.lg,
        }}
      >
        <Text style={{ fontSize: 48 }}>🐾</Text>
      </View>
      <Text style={{ ...Typography.preset.h3, color: Colors.text.primary, textAlign: 'center' }}>
        첫 반려동물을 등록해보세요
      </Text>
      <Text
        style={{
          ...Typography.preset.body,
          color: Colors.text.secondary,
          textAlign: 'center',
          marginTop: Spacing.sm,
          marginBottom: Spacing.xl,
        }}
      >
        진료기록·다이어리·건강 수치까지{'\n'}한 번에 관리할 수 있어요
      </Text>
      <Button onPress={onAddPet} icon="plus" fullWidth>
        반려동물 추가
      </Button>
    </View>
  );
}

function PetCard({ pet, onPress }: { pet: any; onPress: () => void }) {
  const Colors = useColors();
  const age = ageFromBirthDate(pet.birthDate);
  const ringTone = speciesRingTone(pet.species, Colors);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!pet.profileImage && !imageFailed;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{ width: 88, alignItems: 'center' }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: ringTone,
          padding: 3,
          alignItems: 'center',
          justifyContent: 'center',
          ...Elevation.card,
        }}
      >
        {showImage ? (
          <Image
            source={{ uri: pet.profileImage }}
            style={{ width: 66, height: 66, borderRadius: 33 }}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <InitialAvatar name={pet.name} size={66} species={pet.species} />
        )}
        {pet.isShared ? (
          <View
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: Colors.primaryDark,
              borderWidth: 2,
              borderColor: Colors.white,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="users" size={10} color={Colors.white} />
          </View>
        ) : null}
      </View>
      <Text
        numberOfLines={1}
        style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary, marginTop: Spacing.sm }}
      >
        {pet.name}
      </Text>
      {pet.isShared && pet.ownerName ? (
        <Text
          numberOfLines={1}
          style={{ ...Typography.preset.caption, color: Colors.primaryDark, marginTop: 2, fontWeight: Typography.weight.semibold }}
        >
          {pet.ownerName}님 공유
        </Text>
      ) : age ? (
        <Text
          numberOfLines={1}
          style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: 2 }}
        >
          {age}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

function AddPetTile({ onPress, locked = false }: { onPress: () => void; locked?: boolean }) {
  const Colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ width: 88, alignItems: 'center' }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: locked ? Colors.premium : Colors.primaryLight,
          backgroundColor: Colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name="plus" size={24} color={locked ? Colors.premium : Colors.primary} />
        {locked ? (
          <View style={{ position: 'absolute', top: -4, right: -4 }}>
            <PremiumLock size="sm" pressable={false} />
          </View>
        ) : null}
      </View>
      <Text
        style={{ ...Typography.preset.bodyMedium, color: locked ? Colors.premium : Colors.primary, marginTop: Spacing.sm }}
      >
        {locked ? '프리미엄' : '추가'}
      </Text>
    </TouchableOpacity>
  );
}

// 모든 펫 합산 1카드 — 멀티펫이라도 화면 길이가 일정. 펫별 상세는 펫 카드 탭으로.
function WeeklySummaryCard() {
  const Colors = useColors();
  const stats = useWeeklyStats(null);
  return (
    <View
      style={{
        padding: Spacing.md,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: Spacing.borderRadius.lg,
        ...Elevation.card,
      }}
    >
      <View style={{ flexDirection: 'row', gap: Spacing.md }}>
        <MiniStat label="다이어리" value={stats.diaryCount} unit="건" />
        <MiniStat label="사진" value={stats.photoCount} unit="장" />
        <MiniStat label="진료" value={stats.recordCount} unit="건" />
        <MiniStat
          label="최근 병원"
          value={stats.lastVisitDaysAgo}
          unit={stats.lastVisitDaysAgo === 0 ? '' : '일 전'}
          emptyText="—"
        />
      </View>
    </View>
  );
}

function MiniStat({
  value, unit, label, emptyText,
}: {
  value: number | null;
  unit: string;
  label: string;
  emptyText?: string;
}) {
  const Colors = useColors();
  const display = value == null ? (emptyText ?? '0') : String(value);
  return (
    <View style={{ flex: 1 }}>
      <Text numberOfLines={1} style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginBottom: 2 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
        <Text style={{ ...Typography.preset.heading, color: Colors.text.primary, fontWeight: Typography.weight.bold }}>
          {display}
        </Text>
        {unit ? (
          <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary }}>{unit}</Text>
        ) : null}
      </View>
    </View>
  );
}


function SeasonalTipCard({ onDismiss }: { onDismiss?: () => void }) {
  const Colors = useColors();
  // 마운트 시 1회 랜덤 선택 (매 렌더 깜빡임 방지). 화면 재진입 시 새 값.
  const tip = useMemo(() => getMonthlyTip(), []);
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
        style={{
          padding: Spacing.lg,
          backgroundColor: Colors.primaryLight,
          borderRadius: Spacing.borderRadius.lg,
          flexDirection: 'row',
          gap: Spacing.md,
          alignItems: 'flex-start',
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={require('../../assets/icon.png')}
            style={{ width: 28, height: 28, borderRadius: 6 }}
            resizeMode="contain"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary, fontWeight: Typography.weight.semibold }}>
            {tip.title}
          </Text>
          <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginTop: Spacing.xs }}>
            {tip.body}
          </Text>
          <Text style={{ ...Typography.preset.caption, color: Colors.primaryDark, marginTop: Spacing.sm, fontWeight: Typography.weight.semibold }}>
            모든 안내 보기 →
          </Text>
        </View>
        {onDismiss ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            hitSlop={Spacing.hitSlop}
            style={{ padding: 4 }}
          >
            <Feather name="x" size={16} color={Colors.text.tertiary} />
          </Pressable>
        ) : null}
      </TouchableOpacity>
      <MonthlyCareGuideModal visible={open} onClose={() => setOpen(false)} />
    </>
  );
}


function OnboardingCard({
  step, onDismiss,
}: {
  step: Exclude<ReturnType<typeof useOnboardingStep>, null>;
  onDismiss: () => void;
}) {
  const Colors = useColors();
  const meta = getStepMeta(step);
  return (
    <View
      style={{
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        padding: Spacing.lg,
        borderRadius: Spacing.borderRadius.xl,
        backgroundColor: Colors.surfaceElevated,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        gap: Spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Feather name="zap" size={14} color={Colors.primaryDark} />
          <Text style={{ ...Typography.preset.caption, color: Colors.primaryDark, fontWeight: Typography.weight.bold }}>
            시작 가이드
          </Text>
        </View>
        <Pressable onPress={onDismiss} hitSlop={Spacing.hitSlop}>
          <Feather name="x" size={16} color={Colors.text.tertiary} />
        </Pressable>
      </View>
      <Text style={{ ...Typography.preset.body, color: Colors.text.primary, fontWeight: Typography.weight.semibold }}>
        {meta.title}
      </Text>
      <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary }}>
        {meta.body}
      </Text>
      <TouchableOpacity
        onPress={() => router.push(meta.route as any)}
        activeOpacity={0.85}
        style={{
          marginTop: Spacing.xs,
          paddingVertical: Spacing.sm,
          paddingHorizontal: Spacing.md,
          borderRadius: Spacing.borderRadius.md,
          backgroundColor: Colors.primaryDark,
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Text style={{ ...Typography.preset.caption, color: Colors.text.inverse, fontWeight: Typography.weight.bold }}>
          {meta.cta}
        </Text>
        <Feather name="arrow-right" size={14} color={Colors.text.inverse} />
      </TouchableOpacity>
    </View>
  );
}

function HomeCareCard({ care, multi }: { care: HomeCare; multi: boolean }) {
  const Colors = useColors();
  const setSelectedPetId = usePetFilterStore((s) => s.setSelectedPetId);
  const pct = care.totalTargets === 0 ? 0 : Math.round((care.totalCompleted / care.totalTargets) * 100);
  const done = pct === 100;
  return (
    <TouchableOpacity
      onPress={() => {
        setSelectedPetId(care.petId);
        router.push({ pathname: '/(tabs)/records', params: { tab: 'daily' } });
      }}
      activeOpacity={0.85}
      style={{
        padding: Spacing.md,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: Spacing.borderRadius.lg,
        ...Elevation.card,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          {multi ? (
            <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
              {care.petName}
            </Text>
          ) : null}
          <Text style={{ ...Typography.preset.body, color: Colors.text.primary, fontWeight: Typography.weight.semibold }}>
            오늘 케어 {care.totalCompleted}/{care.totalTargets}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
          {done ? <Feather name="check-circle" size={16} color={Colors.status.success} /> : null}
          <Text
            style={{
              ...Typography.preset.body,
              color: done ? Colors.status.success : Colors.secondaryDark,
              fontWeight: Typography.weight.bold,
            }}
          >
            {pct}%
          </Text>
        </View>
      </View>
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: Colors.border,
          marginTop: Spacing.sm,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: done ? Colors.status.success : Colors.secondary,
          }}
        />
      </View>
    </TouchableOpacity>
  );
}

function UpcomingItem({ vaccine }: { vaccine: VaccineWithPet }) {
  const Colors = useColors();
  const dDayLabel = vaccine.dDay === 0 ? '오늘' : `D-${vaccine.dDay}`;
  const tone: 'warning' | 'primary' = vaccine.dDay !== null && vaccine.dDay <= 7 ? 'warning' : 'primary';
  return (
    <Card variant="elevated" padding="md">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather name="shield" size={18} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...Typography.preset.body, color: Colors.text.primary, fontWeight: Typography.weight.semibold }}>
            {vaccine.vaccineName}
          </Text>
          <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
            {vaccine.petName} · {vaccine.nextVaccineAt}
          </Text>
        </View>
        <Badge tone={tone}>{dDayLabel}</Badge>
      </View>
    </Card>
  );
}
