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

interface SeasonTip {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  body: string;
}

type Season = 'spring' | 'summer' | 'autumn' | 'winter';

const SEASON_TIPS: Record<Season, SeasonTip[]> = {
  spring: [
    { icon: 'shield', title: '진드기·벼룩 예방 시작 시기',
      body: '봄철 산책이 늘면서 외부 기생충 노출도 함께 증가해요. 월 1회 예방약을 챙겨주세요.' },
    { icon: 'search', title: '산책 후 몸 체크 필요',
      body: '풀숲을 다녀온 뒤에는 귀, 겨드랑이, 발가락 사이, 꼬리 주변에 진드기가 붙었는지 확인해주세요.' },
    { icon: 'heart', title: '심장사상충 예방 유지',
      body: '모기가 보이기 전부터 예방이 중요해요. 계절이 바뀌어도 예방약은 꾸준히 챙겨주세요.' },
    { icon: 'eye', title: '꽃가루 알레르기 주의',
      body: '발 핥기, 피부 붉어짐, 눈물, 귀 가려움이 늘면 계절성 알레르기일 수 있어요.' },
    { icon: 'droplet', title: '외출 후 발 닦기 습관',
      body: '산책 후 발과 배 쪽을 닦아주면 꽃가루, 먼지, 외부 자극물 접촉을 줄일 수 있어요.' },
    { icon: 'alert-octagon', title: '반려동물 독성 식물 주의',
      body: '백합류는 특히 고양이에게 매우 위험해요. 봄꽃을 집에 들일 때 식물 독성을 확인해주세요.' },
    { icon: 'alert-octagon', title: '구근 식물 섭취 주의',
      body: '튤립, 수선화, 붓꽃 등 구근 식물은 섭취 시 위장 증상이나 중독 위험이 있어요.' },
    { icon: 'alert-triangle', title: '비료·제초제 사용 후 출입 제한',
      body: '마당이나 화단에 약품을 사용했다면 완전히 마르고 안전 시간이 지난 뒤 접근하게 해주세요.' },
    { icon: 'alert-circle', title: '봄맞이 청소용품 보관 주의',
      body: '세제, 소독제, 방향제는 반려동물이 핥거나 밟지 않도록 사용 후 환기와 보관을 철저히 해주세요.' },
    { icon: 'square', title: '창문·방충망 추락 사고 주의',
      body: '날이 따뜻해지며 창문을 여는 일이 늘어요. 방충망과 베란다 안전 상태를 확인해주세요.' },
    { icon: 'alert-octagon', title: '야생 버섯 섭취 금지',
      body: '비 온 뒤 생긴 버섯은 독성 구분이 어려워요. 산책 중 먹지 못하게 막아주세요.' },
    { icon: 'tag', title: '봄나들이 전 인식표 확인',
      body: '외출과 여행이 늘어나는 시기예요. 인식표, 마이크로칩, 하네스 상태를 미리 확인해주세요.' },
    { icon: 'calendar', title: '예방접종 일정 점검',
      body: '외부 활동이 늘기 전 광견병, 종합백신, 구충 등 기본 예방 일정을 확인해주세요.' },
    { icon: 'wind', title: '환절기 컨디션 변화 관찰',
      body: '일교차가 큰 시기에는 식욕 저하, 기침, 무기력 등 작은 변화도 유심히 봐주세요.' },
    { icon: 'disc', title: '귀·피부 염증 관리 시기',
      body: '습도와 알레르기 영향으로 귀 냄새, 긁기, 피부 트러블이 늘 수 있어요.' },
  ],
  summer: [
    { icon: 'thermometer', title: '열사병 최고 주의 시기',
      body: '과도한 헐떡임, 침 흘림, 구토, 비틀거림은 응급 신호예요. 즉시 시원한 곳으로 옮겨주세요.' },
    { icon: 'alert-triangle', title: '차 안 방치 절대 금지',
      body: '잠깐이라도 여름철 차량 내부 온도는 급격히 올라가요. 반려동물을 차 안에 두지 마세요.' },
    { icon: 'alert-circle', title: '발바닥 화상 주의',
      body: '아스팔트와 모래가 뜨거우면 발바닥 화상이 생길 수 있어요. 산책 전 바닥 온도를 확인해주세요.' },
    { icon: 'clock', title: '산책 시간 조정 필요',
      body: '한낮 산책은 피하고 이른 아침이나 해가 진 뒤로 산책 시간을 바꿔주세요.' },
    { icon: 'droplet', title: '물과 그늘 확보 필수',
      body: '여름에는 탈수가 빠르게 올 수 있어요. 실내외 모두 신선한 물과 그늘을 준비해주세요.' },
    { icon: 'wind', title: '단두종은 더위에 더 취약',
      body: '퍼그, 불도그, 시추 등 코가 짧은 견종은 호흡이 어려워 더위 노출을 더 조심해야 해요.' },
    { icon: 'target', title: '모기 활동 증가 시기',
      body: '여름철 모기 증가로 심장사상충 위험이 커져요. 예방약과 정기검사를 유지해주세요.' },
    { icon: 'life-buoy', title: '물놀이 중 익수 사고 주의',
      body: '수영을 잘하는 반려동물도 지칠 수 있어요. 구명조끼와 보호자 감시는 필수예요.' },
    { icon: 'alert-octagon', title: '녹조 물 접촉 금지',
      body: '색이 이상하거나 냄새나는 물은 독성 조류 위험이 있어요. 마시거나 들어가지 못하게 해주세요.' },
    { icon: 'disc', title: '외이염 발생 증가 시기',
      body: '습하고 더운 날씨에는 귀 염증이 잘 생겨요. 귀 냄새, 머리 흔들기, 긁기를 확인해주세요.' },
    { icon: 'thermometer', title: '냉방병과 온도차 주의',
      body: '실내외 온도 차가 크면 호흡기나 컨디션 문제가 생길 수 있어요. 급격한 온도 변화를 줄여주세요.' },
    { icon: 'slash', title: '사료·간식 변질 주의',
      body: '고온다습한 환경에서는 음식이 빨리 상해요. 개봉한 사료와 간식은 밀폐 보관해주세요.' },
    { icon: 'scissors', title: '무리한 미용 주의',
      body: '털을 너무 짧게 밀면 피부가 햇빛과 열에 더 노출될 수 있어요. 엉킨 털 정리를 우선해주세요.' },
    { icon: 'check-square', title: '휴가 전 건강 상태 확인',
      body: '호텔링, 펜션, 장거리 이동 전 예방접종, 기생충 예방, 이동장 적응을 확인해주세요.' },
    { icon: 'package', title: '폭염·폭우 대비 물품 준비',
      body: '정전이나 재난 상황에 대비해 사료, 물, 약, 이동장, 진료기록을 미리 챙겨두세요.' },
  ],
  autumn: [
    { icon: 'shield', title: '진드기 예방 계속 필요',
      body: '날이 선선해져도 진드기 활동은 이어질 수 있어요. 예방약과 산책 후 확인을 계속해주세요.' },
    { icon: 'search', title: '풀숲 산책 후 몸 확인',
      body: '낙엽과 풀숲에 숨어 있는 진드기나 이물질이 붙을 수 있어요. 귀와 발 사이를 확인해주세요.' },
    { icon: 'alert-octagon', title: '야생 버섯 섭취 주의',
      body: '가을에는 버섯이 많이 자라요. 독성 여부를 알기 어려우니 산책 중 먹지 못하게 해주세요.' },
    { icon: 'alert-octagon', title: '쥐약·살서제 접근 금지',
      body: '가을철 쥐약 사용이 늘 수 있어요. 반려동물이 닿지 않는 곳에 보관하고 산책 중 섭취를 막아주세요.' },
    { icon: 'slash', title: '초콜릿·자일리톨 주의',
      body: '할로윈이나 간식 시즌에는 초콜릿과 무설탕 제품 노출이 늘어요. 절대 먹이지 마세요.' },
    { icon: 'tag', title: '의상 착용 스트레스 확인',
      body: '반려동물 의상은 호흡, 보행, 시야를 방해하지 않아야 해요. 불편해하면 바로 벗겨주세요.' },
    { icon: 'volume-2', title: '방문객·소음 스트레스 관리',
      body: '초인종, 낯선 사람, 행사 소음은 불안을 유발할 수 있어요. 조용한 휴식 공간을 마련해주세요.' },
    { icon: 'slash', title: '명절 음식 공유 금지',
      body: '양파, 마늘, 뼈, 기름진 음식은 위험할 수 있어요. 사람 음식을 나눠주지 않는 게 안전해요.' },
    { icon: 'trash-2', title: '음식물 쓰레기통 관리',
      body: '뼈, 포장지, 상한 음식 섭취 사고가 생길 수 있어요. 쓰레기통은 반드시 닫아두세요.' },
    { icon: 'activity', title: '관절 통증 관찰 시기',
      body: '일교차가 커지면 노령견·노령묘의 관절 통증이 두드러질 수 있어요. 움직임 변화를 확인해주세요.' },
    { icon: 'feather', title: '털갈이 관리 필요',
      body: '가을 털갈이 시기에는 빗질로 엉킴, 피부 자극, 헤어볼 위험을 줄여주세요.' },
    { icon: 'droplet', title: '실내 건조 대비 시작',
      body: '난방을 시작하면 피부와 호흡기가 건조해질 수 있어요. 물 섭취와 습도를 확인해주세요.' },
    { icon: 'link', title: '하네스·리드줄 점검',
      body: '야외 활동이 늘어나는 계절이에요. 목줄, 하네스, 리드줄 마모 상태를 확인해주세요.' },
    { icon: 'clipboard', title: '겨울 전 건강검진 고려',
      body: '추운 계절 전 치아, 체중, 심장, 신장, 관절 상태를 확인하면 겨울 관리가 쉬워져요.' },
    { icon: 'bar-chart', title: '체중 변화 체크',
      body: '활동량과 식욕이 달라질 수 있는 시기예요. 갑작스러운 체중 증가나 감소를 확인해주세요.' },
  ],
  winter: [
    { icon: 'cloud-snow', title: '저체온증 주의 시기',
      body: '추운 날 장시간 야외 노출은 위험해요. 떨림, 무기력, 몸이 차가운 증상을 확인해주세요.' },
    { icon: 'alert-circle', title: '동상 위험 부위 확인',
      body: '귀 끝, 꼬리, 발끝은 추위에 취약해요. 산책 후 차갑거나 창백한 부위가 없는지 봐주세요.' },
    { icon: 'wind', title: '단모종·노령동물 보온 필요',
      body: '소형견, 단모종, 노령, 어린 동물은 추위에 약해요. 보온복과 짧은 산책을 고려해주세요.' },
    { icon: 'droplet', title: '제설제·염화칼슘 제거',
      body: '산책 후 발과 배를 닦아주세요. 제설제는 피부 자극이나 섭취 위험이 있을 수 있어요.' },
    { icon: 'alert-octagon', title: '부동액 섭취 절대 주의',
      body: '자동차 냉각수와 부동액은 소량도 위험해요. 흘린 액체는 즉시 닦고 밀폐 보관해주세요.' },
    { icon: 'alert-triangle', title: '엔진룸 고양이 사고 주의',
      body: '추운 날 고양이가 차 밑이나 엔진룸에 숨을 수 있어요. 시동 전 보닛을 두드려주세요.' },
    { icon: 'alert-circle', title: '난방기 화상 주의',
      body: '히터, 전기장판, 핫팩은 저온화상 위험이 있어요. 직접 오래 닿지 않도록 해주세요.' },
    { icon: 'zap', title: '전선 씹힘 사고 예방',
      body: '전기장판, 트리 조명, 난방기 전선은 감전 위험이 있어요. 전선 정리와 보호 커버를 챙겨주세요.' },
    { icon: 'droplet', title: '건조한 피부 관리 필요',
      body: '겨울 실내는 건조해 피부 가려움이 생길 수 있어요. 가습, 빗질, 목욕 간격을 조절해주세요.' },
    { icon: 'activity', title: '활동량 감소와 체중 증가 주의',
      body: '산책 시간이 줄면 살이 쉽게 찔 수 있어요. 급여량과 간식량을 함께 조절해주세요.' },
    { icon: 'alert-triangle', title: '눈길 미끄러짐 주의',
      body: '빙판길 산책은 관절과 인대에 부담을 줄 수 있어요. 천천히 걷고 무리한 뛰기는 피해주세요.' },
    { icon: 'gift', title: '크리스마스 장식 섭취 주의',
      body: '리본, 반짝이 줄, 유리 장식은 장폐색이나 상처 위험이 있어요. 접근을 제한해주세요.' },
    { icon: 'alert-triangle', title: '양초·방향제 사용 주의',
      body: '촛불은 화상과 화재 위험이 있고, 강한 향은 호흡기에 자극이 될 수 있어요.' },
    { icon: 'slash', title: '연말 음식·술 섭취 금지',
      body: '초콜릿, 술, 기름진 고기, 뼈, 자일리톨 음식은 반려동물에게 위험할 수 있어요.' },
    { icon: 'package', title: '한파·정전 대비 가방 준비',
      body: '사료, 물, 약, 담요, 이동장, 진료기록을 미리 준비해두면 응급 상황에 빠르게 대응할 수 있어요.' },
  ],
};

const SEASON_LABEL: Record<Season, string> = {
  spring: '봄', summer: '여름', autumn: '가을', winter: '겨울',
};

function getCurrentSeason(): Season {
  const month = new Date().getMonth() + 1;
  return month >= 3 && month <= 5 ? 'spring'
    : month >= 6 && month <= 8 ? 'summer'
    : month >= 9 && month <= 11 ? 'autumn'
    : 'winter';
}

function getSeasonalTip(): SeasonTip {
  const tips = SEASON_TIPS[getCurrentSeason()];
  return tips[Math.floor(Math.random() * tips.length)];
}

function SeasonalTipCard({ onDismiss }: { onDismiss?: () => void }) {
  const Colors = useColors();
  // 마운트 시 1회 랜덤 선택 (매 렌더 깜빡임 방지). 화면 재진입 시 새 값.
  const tip = useMemo(() => getSeasonalTip(), []);
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
      <SeasonalTipsModal visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function SeasonalTipsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const Colors = useColors();
  const season = getCurrentSeason();
  const tips = SEASON_TIPS[season];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: Colors.overlay }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            marginTop: 'auto',
            backgroundColor: Colors.surfaceElevated,
            borderTopLeftRadius: Spacing.borderRadius.xxl,
            borderTopRightRadius: Spacing.borderRadius.xxl,
            padding: Spacing.lg,
            paddingBottom: Spacing.xxxl,
            maxHeight: '85%',
            ...Elevation.modal,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.border,
              marginBottom: Spacing.md,
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg }}>
            <Text style={{ ...Typography.preset.title, color: Colors.text.primary, fontWeight: Typography.weight.bold }}>
              {SEASON_LABEL[season]} 케어 안내
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={Spacing.hitSlop}>
              <Text style={{ ...Typography.preset.body, color: Colors.text.secondary }}>닫기</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
            {tips.map((tip, i) => (
              <View
                key={i}
                style={{
                  padding: Spacing.md,
                  backgroundColor: Colors.primaryLight,
                  borderRadius: Spacing.borderRadius.lg,
                  flexDirection: 'row',
                  gap: Spacing.md,
                  alignItems: 'flex-start',
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: Colors.white,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    source={require('../../assets/icon.png')}
                    style={{ width: 24, height: 24, borderRadius: 5 }}
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
                </View>
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
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
              color: done ? Colors.status.success : Colors.primaryDark,
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
            backgroundColor: done ? Colors.status.success : Colors.primaryDark,
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
