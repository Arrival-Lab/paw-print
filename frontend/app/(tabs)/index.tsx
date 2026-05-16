import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, Modal, Pressable,
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
import { usePetFilterStore } from '../../shared/store/petFilterStore';
import { vaccineApi, type VaccineWithPet } from '../../features/vaccine/api/vaccineApi';
import { useWeeklyStats } from '../../features/home/hooks/useWeeklyStats';
import { useHomeCare } from '../../features/care/hooks/useCare';
import type { HomeCare } from '../../features/care/api/careApi';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import Badge from '../../shared/components/Badge';
import Fab from '../../shared/components/Fab';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

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
  const selectedPetId = usePetFilterStore((s) => s.selectedPetId);
  const setSelectedPetId = usePetFilterStore((s) => s.setSelectedPetId);
  const [showActionSheet, setShowActionSheet] = useState(false);

  const isFree = user?.subscriptionType === 'FREE';

  const { data: upcomingAll } = useQuery({
    queryKey: ['vaccines', 'upcoming', 30],
    queryFn: () => vaccineApi.getUpcoming(30),
    enabled: !!pets?.length,
    staleTime: 60_000,
  });

  const upcomingVaccines = useMemo(() => {
    const list = upcomingAll ?? [];
    const filtered = selectedPetId == null ? list : list.filter((v) => v.petId === selectedPetId);
    return filtered.slice(0, 3);
  }, [upcomingAll, selectedPetId]);

  const weekly = useWeeklyStats(selectedPetId);
  const { data: homeCare } = useHomeCare();
  const homeCareFiltered = useMemo(() => {
    const list = homeCare ?? [];
    return selectedPetId == null ? list : list.filter((c) => c.petId === selectedPetId);
  }, [homeCare, selectedPetId]);

  const handleAddPet = () => {
    if (isFree && (pets?.length ?? 0) >= Config.freeMaxPets) {
      showPremiumModal(`무료 플랜은 반려동물을 최대 ${Config.freeMaxPets}마리까지 등록할 수 있어요.`);
      return;
    }
    router.push('/pets/new');
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  const hasPets = (pets?.length ?? 0) > 0;
  const selectedPet = selectedPetId != null ? pets?.find((p) => p.id === selectedPetId) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Spacing.xxxxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* 인사말 (compact) */}
        <View
          style={{
            marginHorizontal: Spacing.lg,
            marginTop: Spacing.lg,
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.md,
            borderRadius: Spacing.borderRadius.xl,
            backgroundColor: Colors.secondaryLight,
            overflow: 'hidden',
          }}
        >
          <Text
            pointerEvents="none"
            style={{ position: 'absolute', right: -6, top: -16, fontSize: 72, opacity: 0.18 }}
          >
            🐾
          </Text>
          <Text style={{ ...Typography.preset.title, color: Colors.text.primary }}>
            안녕하세요, {user.name}님
          </Text>
          <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginTop: 4 }}>
            오늘도 반려동물과 행복한 하루 보내세요
          </Text>
        </View>

        {/* 이 계절엔 — 인사말 다음 콘텐츠 영역, 우측에 응급실 chip */}
        <Section
          title="이 계절엔"
          right={
            <Pressable
              onPress={() => router.push('/hospital')}
              hitSlop={Spacing.hitSlop}
              accessibilityLabel="응급병원 찾기"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: Spacing.borderRadius.full,
                backgroundColor: Colors.status.errorBg,
              }}
            >
              <Feather name="plus-square" size={14} color={Colors.status.error} />
              <Text
                style={{
                  fontSize: Typography.size.xs,
                  color: Colors.status.error,
                  fontWeight: Typography.weight.bold,
                }}
              >
                응급실
              </Text>
            </Pressable>
          }
        >
          <View style={{ paddingHorizontal: Spacing.lg }}>
            <SeasonalTipCard />
          </View>
        </Section>

        {!petsLoading && !hasPets ? (
          <EmptyHero onAddPet={handleAddPet} />
        ) : (
          <>
            {/* 내 반려동물 — 카드 자체가 필터 */}
            <Section
              title="내 반려동물"
              caption={selectedPet ? `${selectedPet.name} 보기` : '전체 보기'}
              right={
                selectedPet ? (
                  <TouchableOpacity
                    onPress={() => setSelectedPetId(null)}
                    hitSlop={Spacing.hitSlop}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 2,
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: Spacing.borderRadius.full,
                      backgroundColor: Colors.primaryLight,
                    }}
                  >
                    <Feather name="x" size={12} color={Colors.primary} />
                    <Text
                      style={{
                        fontSize: Typography.size.xs,
                        color: Colors.primary,
                        fontWeight: Typography.weight.semibold,
                      }}
                    >
                      전체 보기
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                    {pets?.length ?? 0}{isFree ? ` / ${Config.freeMaxPets}` : ''}
                  </Text>
                )
              }
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.md }}
              >
                {(pets ?? []).map((pet) => (
                  <PetCard
                    key={pet.id}
                    pet={pet}
                    selected={pet.id === selectedPetId}
                    onPress={() =>
                      setSelectedPetId(pet.id === selectedPetId ? null : pet.id)
                    }
                    onLongPress={() =>
                      router.push({ pathname: '/pets/[id]', params: { id: pet.id } })
                    }
                  />
                ))}
                <AddPetTile onPress={handleAddPet} />
              </ScrollView>
            </Section>

            {/* 오늘 알림 */}
            {upcomingVaccines.length > 0 && (
              <Section
                title={selectedPet ? `${selectedPet.name} 알림` : '오늘 챙길 일'}
                accent
              >
                <View style={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm }}>
                  {upcomingVaccines.map((v) => (
                    <UpcomingItem key={`${v.petId}-${v.id}`} vaccine={v} />
                  ))}
                </View>
              </Section>
            )}

            {/* 오늘의 케어 */}
            {homeCareFiltered.length > 0 && (
              <Section
                title="오늘의 케어"
                right={
                  <TouchableOpacity onPress={() => router.push('/care')} hitSlop={Spacing.hitSlop}>
                    <Text style={{ ...Typography.preset.caption, color: Colors.primaryDark, fontWeight: Typography.weight.semibold }}>
                      관리
                    </Text>
                  </TouchableOpacity>
                }
              >
                <View style={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm }}>
                  {homeCareFiltered.map((c) => (
                    <HomeCareCard key={c.petId} care={c} multi={selectedPetId == null} />
                  ))}
                </View>
              </Section>
            )}

            {/* 이번 주 요약 */}
            <Section title="이번 주 요약" caption={selectedPet ? selectedPet.name : '전체 반려동물'}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm }}
              >
                <StatCard
                  value={weekly.diaryCount}
                  unit="건"
                  label="다이어리"
                />
                <StatCard
                  value={weekly.recordCount}
                  unit="건"
                  label="진료 누적"
                />
                <StatCard
                  value={weekly.lastVisitDaysAgo}
                  unit={weekly.lastVisitDaysAgo === 0 ? '' : '일 전'}
                  emptyText="—"
                  label="최근 병원"
                />
              </ScrollView>
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
        onNavigate={(path) => {
          setShowActionSheet(false);
          router.push(path);
        }}
      />
    </SafeAreaView>
  );
}

function QuickActionSheet({
  visible,
  onClose,
  onNavigate,
}: {
  visible: boolean;
  onClose: () => void;
  onNavigate: (path: '/diary' | '/records') => void;
}) {
  const Colors = useColors();
  const actions = [
    { icon: 'edit-3' as const, label: '다이어리 메모', desc: '오늘 하루 자유롭게', path: '/diary' as const },
    { icon: 'file-text' as const, label: '진료기록', desc: '병원 방문·처방전 사진', path: '/records' as const },
    { icon: 'shield' as const, label: '예방접종 등록', desc: '다음 접종일 자동 알림', path: '/records' as const },
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
                  backgroundColor: Colors.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name={a.icon} size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...Typography.preset.body, color: Colors.text.primary, fontWeight: Typography.weight.semibold }}>
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

function PetCard({ pet, selected, onPress, onLongPress }: { pet: any; selected?: boolean; onPress: () => void; onLongPress?: () => void }) {
  const Colors = useColors();
  const age = ageFromBirthDate(pet.birthDate);
  const ringTone = speciesRingTone(pet.species, Colors);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!pet.profileImage && !imageFailed;
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      activeOpacity={0.85}
      style={{ width: 88, alignItems: 'center' }}
    >
      <View
        style={{
          width: 76,
          height: 76,
          borderRadius: 38,
          padding: 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected ? Colors.primary : 'transparent',
        }}
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
        </View>
      </View>
      <Text
        numberOfLines={1}
        style={{
          ...Typography.preset.bodyMedium,
          color: selected ? Colors.primary : Colors.text.primary,
          fontWeight: selected ? Typography.weight.bold : Typography.weight.medium,
          marginTop: Spacing.sm,
        }}
      >
        {pet.name}
      </Text>
      <Text
        numberOfLines={1}
        style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: 2 }}
      >
        {SPECIES_LABEL[pet.species] ?? pet.species}
        {age ? ` · ${age}` : ''}
      </Text>
    </TouchableOpacity>
  );
}

function AddPetTile({ onPress }: { onPress: () => void }) {
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
          borderColor: Colors.primaryLight,
          backgroundColor: Colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name="plus" size={24} color={Colors.primary} />
      </View>
      <Text
        style={{ ...Typography.preset.bodyMedium, color: Colors.primary, marginTop: Spacing.sm }}
      >
        추가
      </Text>
    </TouchableOpacity>
  );
}

function StatCard({
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
    <View
      style={{
        width: 92,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: Spacing.borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
      }}
    >
      <Text
        numberOfLines={1}
        style={{ ...Typography.preset.bodySmall, color: Colors.text.tertiary, marginBottom: Spacing.xs }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
        <Text style={{ ...Typography.preset.title, color: Colors.text.primary, fontWeight: Typography.weight.bold }}>
          {display}
        </Text>
        {unit ? (
          <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary }}>{unit}</Text>
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

function getSeasonalTip(): SeasonTip {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) {
    return {
      icon: 'shield',
      title: '진드기·심장사상충 주의 시기',
      body: '봄철 산책이 늘면서 외부 기생충 노출도 함께 증가해요. 월 1회 예방약 챙겨주세요.',
    };
  }
  if (month >= 6 && month <= 8) {
    return {
      icon: 'sun',
      title: '더위 · 탈수 조심하세요',
      body: '한낮 산책은 피하고, 시원한 물·그늘·습한 발바닥을 자주 확인해 주세요.',
    };
  }
  if (month >= 9 && month <= 11) {
    return {
      icon: 'wind',
      title: '환절기 호흡기 관리',
      body: '일교차로 면역력이 떨어지기 쉬워요. 식욕·활력 변화가 있으면 빠르게 진료 받으세요.',
    };
  }
  return {
    icon: 'cloud-snow',
    title: '관절·체온 관리',
    body: '추위에 관절이 굳기 쉬워요. 산책 시간은 짧게, 실내는 적정 습도를 유지해 주세요.',
  };
}

function SeasonalTipCard() {
  const Colors = useColors();
  const tip = getSeasonalTip();
  return (
    <View
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
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: Colors.white,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name={tip.icon} size={18} color={Colors.primary} />
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
  );
}

function HomeCareCard({ care, multi }: { care: HomeCare; multi: boolean }) {
  const Colors = useColors();
  const pct = care.totalTargets === 0 ? 0 : Math.round((care.totalCompleted / care.totalTargets) * 100);
  const done = pct === 100;
  return (
    <TouchableOpacity
      onPress={() => router.push('/care')}
      activeOpacity={0.85}
      style={{
        padding: Spacing.md,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: Spacing.borderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
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
