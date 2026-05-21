import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, RefreshControl, StyleSheet, Platform, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Typography, Spacing } from '../../constants';
import { useColors, useTheme } from '../../shared/hooks/useTheme';
import { usePet, useDeletePet } from '../../features/pet/hooks/usePets';
import { useVaccines } from '../../features/vaccine/hooks/useVaccines';
import type { Vaccine } from '../../features/vaccine/api/vaccineApi';
import { useMetricChart, useMetrics } from '../../features/metric/hooks/useMetrics';
import { useRecentDiaries } from '../../features/diary/hooks/useRecentDiaries';
import { useFoodInfo, useUpsertFood } from '../../features/food/hooks/useFood';
import { FoodEditor } from '../../features/food/components/FoodEditor';
import type { FoodInfoRequest } from '../../features/food/api/foodApi';
import PetShareSection from '../../features/share/components/PetShareSection';
import { MetricChart } from '../../features/metric/components/MetricChart';
import { Modal, Pressable, Dimensions } from 'react-native';
import { useRefresh } from '../../shared/hooks/useRefresh';
import ScreenHeader from '../../shared/components/ScreenHeader';
import GlassCard from '../../shared/components/GlassCard';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { formatDate as fmtDate } from '../../shared/utils/format';

const SPECIES_LABEL: Record<string, string> = {
  DOG: '강아지',
  CAT: '고양이',
  BIRD: '새',
  REPTILE: '파충류',
  SMALL_ANIMAL: '소동물',
  OTHER: '기타',
};

const GENDER_LABEL: Record<string, string> = {
  MALE: '남아',
  FEMALE: '여아',
  UNKNOWN: '—',
};

const SPECIES_PAW: Record<string, any> = {
  DOG: require('../../assets/paws/dog.png'),
  CAT: require('../../assets/paws/cat.png'),
  BIRD: require('../../assets/paws/bird.png'),
  REPTILE: require('../../assets/paws/reptile.png'),
  SMALL_ANIMAL: require('../../assets/paws/small.png'),
  OTHER: require('../../assets/paws/other.png'),
};

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

export default function PetDetailScreen() {
  const Colors = useColors();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState(0);
  const { id } = useLocalSearchParams<{ id: string }>();
  const petId = Number(id);
  const { data: pet, isLoading } = usePet(petId);
  const { data: vaccines } = useVaccines(petId);
  const { data: weightChart } = useMetricChart(petId, 'WEIGHT');
  const { data: weightPage } = useMetrics(petId, 'WEIGHT');
  const { data: recentDiaries } = useRecentDiaries(petId, { limit: 6 });
  const { data: foodInfo } = useFoodInfo(petId);
  const { mutate: upsertFood, isPending: foodSaving } = useUpsertFood(petId);
  const { mutate: deletePet } = useDeletePet();
  const [foodEditing, setFoodEditing] = useState(false);
  const [weightModalOpen, setWeightModalOpen] = useState(false);

  const handleDelete = () => {
    const name = (pet as any)?.name ?? '이 반려동물';
    Alert.alert(
      `${name} 삭제`,
      `${name} 의 모든 진료기록·일정·다이어리·체중·케어 기록도 함께 삭제돼요.\n정말 삭제할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            router.replace('/(tabs)');
            deletePet(petId, {
              onError: (e: any) =>
                Alert.alert('삭제 실패', e?.response?.data?.message ?? '잠시 후 다시 시도해주세요.'),
            });
          },
        },
      ],
    );
  };
  const { refreshing, onRefresh } = useRefresh([
    ['pets', petId],
    ['vaccines', petId],
    ['metrics', petId],
    ['metric-chart', petId],
    ['diary-list', petId],
    ['food-info', petId],
  ]);

  // nextVaccineAt 이 있으면 그게 다음 일정. 없을 때 vaccinatedAt 이 미래면
  // 사용자가 "예정 접종일" 의도로 입력한 케이스로 보고 그것도 다가오는 백신으로 취급.
  const upcomingVaccines = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const list = (vaccines ?? []) as unknown as Vaccine[];
    return list
      .map((v) => {
        const targetDate = v.nextVaccineAt ?? v.vaccinatedAt;
        const target = new Date(targetDate);
        target.setHours(0, 0, 0, 0);
        const dDay = Math.round((target.getTime() - todayMs) / 86400000);
        return { vaccine: v, targetDate, dDay };
      })
      .filter((x) => x.dDay >= 0)
      .sort((a, b) => a.dDay - b.dDay)
      .slice(0, 3);
  }, [vaccines]);

  const weightStats = useMemo(() => {
    const points = (weightChart ?? []).slice().sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));
    if (points.length === 0) return null;
    const latest = points[points.length - 1];
    const prev = points.length > 1 ? points[points.length - 2] : null;
    const delta = prev ? latest.value - prev.value : null;
    return { latest, prev, delta, points };
  }, [weightChart]);

  const latestWeight = useMemo(() => {
    const list = weightPage?.pages.flatMap((p: any) => p.content) ?? [];
    return list[0] ?? null;
  }, [weightPage]);

  const diaryPhotos = useMemo(
    () => recentDiaries.filter((d) => !!d.thumbnail).slice(0, 6),
    [recentDiaries],
  );

  if (isLoading || !pet) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  const age = ageFromBirthDate(pet.birthDate);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: Spacing.xxxxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
      >
        {/* Hero — 프로필 이미지 blur 배경 (있을 때만) */}
        {pet.profileImage ? (
          <View style={{ height: 220, marginBottom: -110, overflow: 'hidden' }}>
            <Image
              source={{ uri: pet.profileImage }}
              style={StyleSheet.absoluteFill as any}
              blurRadius={28}
              resizeMode="cover"
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.glass.overlay }]} />
          </View>
        ) : null}

        {/* 프로필 */}
        <View style={{ paddingHorizontal: Spacing.xl, paddingTop: pet.profileImage ? 0 : Spacing.md }}>
          <GlassCard
            tone={pet.profileImage ? 'surfaceStrong' : 'surface'}
            padding="lg"
            intensity={40}
            blur={!!pet.profileImage}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.lg }}>
              <View>
                {pet.profileImage ? (
                  <Image source={{ uri: pet.profileImage }} style={{ width: 80, height: 80, borderRadius: 40 }} />
                ) : (
                  <InitialAvatar name={pet.name} size={80} species={pet.species} />
                )}
                {(pet as any).isShared ? (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: Colors.primaryDark,
                      borderWidth: 1.5,
                      borderColor: Colors.glass.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Feather name="users" size={11} color={Colors.white} />
                  </View>
                ) : null}
              </View>
              <View style={{ flex: 1, paddingTop: 4 }}>
                <Text style={{ ...Typography.preset.heading, color: Colors.text.primary }}>
                  {pet.name}
                </Text>
                <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: Spacing.xs }}>
                  {[
                    SPECIES_LABEL[(pet as any).species] ?? (pet as any).species,
                    age,
                    GENDER_LABEL[(pet as any).gender],
                  ]
                    .filter((v) => v && v !== '—')
                    .join(' · ')}
                  {(pet as any).breed ? ` · ${(pet as any).breed}` : ''}
                </Text>
                {latestWeight ? (
                  <TouchableOpacity
                    onPress={() => setWeightModalOpen(true)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      alignSelf: 'flex-start',
                      gap: 4,
                      marginTop: Spacing.sm,
                      paddingHorizontal: Spacing.sm,
                      paddingVertical: 4,
                      borderRadius: Spacing.borderRadius.full,
                      backgroundColor: Colors.glass.primaryTint,
                      borderWidth: 1,
                      borderColor: Colors.glass.border,
                    }}
                  >
                    <Feather name="trending-up" size={11} color={Colors.primaryDark} />
                    <Text
                      style={{
                        ...Typography.preset.caption,
                        color: Colors.primaryDark,
                        fontWeight: Typography.weight.semibold,
                      }}
                    >
                      {latestWeight.value}{latestWeight.unit ?? 'kg'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </GlassCard>
        </View>

        {/* 다가오는 백신 — D-7 이내 + D-Day 만 노출(시간민감 알림 역할). 그 외는 백신 탭에서. */}
        {upcomingVaccines.length > 0 ? (
          <Section
            title="다가오는 예방접종"
            onAction={() => router.push({ pathname: '/records', params: { tab: 'vaccines' } } as any)}
          >
            <View style={{ paddingHorizontal: Spacing.xl, gap: Spacing.xs }}>
              {upcomingVaccines.map((x) => (
                <View
                  key={x.vaccine.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: Spacing.sm,
                    gap: Spacing.md,
                  }}
                >
                  <View
                    style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...Typography.preset.body,
                        color: Colors.text.primary,
                        fontWeight: Typography.weight.semibold,
                      }}
                    >
                      {x.vaccine.vaccineName}
                    </Text>
                    <Text
                      style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: 2 }}
                    >
                      {x.targetDate}
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: Spacing.sm,
                      paddingVertical: 3,
                      borderRadius: Spacing.borderRadius.full,
                      backgroundColor: x.dDay <= 7 ? Colors.status.warningBg : Colors.glass.primaryTint,
                      borderWidth: 1,
                      borderColor: Colors.glass.border,
                    }}
                  >
                    <Text
                      style={{
                        ...Typography.preset.caption,
                        fontWeight: Typography.weight.bold,
                        color: x.dDay <= 7 ? Colors.status.warning : Colors.primaryDark,
                      }}
                    >
                      {x.dDay === 0 ? '오늘' : `D-${x.dDay}`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        {/* 사료·알러지 */}
        <Section title="사료·알러지" onAction={() => setFoodEditing(true)} actionLabel={foodInfo ? '수정' : '추가'}>
          {!foodInfo || (!foodInfo.currentFood && (foodInfo.allergies?.length ?? 0) === 0 && (foodInfo.forbiddenFoods?.length ?? 0) === 0 && !foodInfo.notes) ? (
            <EmptyHint text="사료·알러지·금지음식 정보를 기록해보세요" />
          ) : (
            <View style={{ paddingHorizontal: Spacing.xl }}>
              <GlassCard tone="surface" padding="md" blur={false}>
                {foodInfo.currentFood ? (
                  <View style={{ marginBottom: Spacing.sm }}>
                    <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>현재 사료</Text>
                    <Text style={{ ...Typography.preset.body, color: Colors.text.primary, marginTop: 2 }}>
                      {foodInfo.currentFood}
                    </Text>
                  </View>
                ) : null}
                {foodInfo.allergies?.length > 0 ? (
                  <View style={{ marginBottom: Spacing.sm }}>
                    <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginBottom: 4 }}>알레르기</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                      {foodInfo.allergies.map((a: string) => (
                        <View
                          key={a}
                          style={{
                            paddingVertical: 2,
                            paddingHorizontal: 8,
                            borderRadius: Spacing.borderRadius.full,
                            backgroundColor: Colors.status.errorBg,
                            borderWidth: 1,
                            borderColor: Colors.glass.border,
                          }}
                        >
                          <Text style={{ ...Typography.preset.caption, color: Colors.status.error }}>{a}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
                {foodInfo.forbiddenFoods?.length > 0 ? (
                  <View style={{ marginBottom: Spacing.sm }}>
                    <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginBottom: 4 }}>금지 음식</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                      {foodInfo.forbiddenFoods.map((f: string) => (
                        <View
                          key={f}
                          style={{
                            paddingVertical: 2,
                            paddingHorizontal: 8,
                            borderRadius: Spacing.borderRadius.full,
                            backgroundColor: Colors.status.warningBg,
                            borderWidth: 1,
                            borderColor: Colors.glass.border,
                          }}
                        >
                          <Text style={{ ...Typography.preset.caption, color: Colors.status.warning }}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
                {foodInfo.notes ? (
                  <View>
                    <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>메모</Text>
                    <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginTop: 2 }}>
                      {foodInfo.notes}
                    </Text>
                  </View>
                ) : null}
              </GlassCard>
            </View>
          )}
        </Section>

        {/* 함께 돌보는 사람 (공유) */}
        <Section title="함께 돌보는 사람">
          <PetShareSection pet={pet} />
        </Section>

        {/* 최근 다이어리 사진 */}
        <Section title="최근 다이어리" onAction={() => router.push('/diary')}>
          {diaryPhotos.length === 0 ? (
            <EmptyHint text="사진과 함께 하루를 기록해보세요" />
          ) : (
            <View
              style={{
                paddingHorizontal: Spacing.xl,
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: Spacing.sm,
              }}
            >
              {diaryPhotos.map((d) => (
                <TouchableOpacity
                  key={`${d.petId}-${d.id}`}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: '/diary/[date]',
                      params: { date: d.diaryDate, petIds: String(d.petId) },
                    })
                  }
                  style={{ width: '31%', aspectRatio: 1, borderRadius: Spacing.borderRadius.md, overflow: 'hidden' }}
                >
                  <Image source={{ uri: d.thumbnail! }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  <View
                    style={{
                      position: 'absolute',
                      left: 6,
                      bottom: 6,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: Spacing.borderRadius.sm,
                      backgroundColor: Colors.glass.surfaceStrong,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: Colors.glass.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: Typography.size.xxs,
                        fontWeight: Typography.weight.semibold,
                        color: Colors.text.primary,
                      }}
                    >
                      {d.diaryDate.slice(5).replace('-', '.')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Section>
      </ScrollView>

      <Modal visible={foodEditing} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFoodEditing(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
          <View style={{ overflow: 'hidden', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.glass.border }}>
            <BlurView
              intensity={25}
              tint={isDark ? 'dark' : 'light'}
              experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
            >
              <View style={{ backgroundColor: Colors.glass.surface }}>
                <ScreenHeader title="사료·알러지" back={() => setFoodEditing(false)} variant="transparent" hideEmergency hideMypage />
              </View>
            </BlurView>
          </View>
          <FoodEditor
            initial={foodInfo}
            onSubmit={(data: FoodInfoRequest) =>
              upsertFood(data, { onSuccess: () => setFoodEditing(false) })
            }
            loading={foodSaving}
          />
        </SafeAreaView>
      </Modal>

      <Modal
        visible={weightModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setWeightModalOpen(false)}
      >
        <Pressable
          onPress={() => setWeightModalOpen(false)}
          style={{ flex: 1, justifyContent: 'center', padding: Spacing.lg }}
        >
          <BlurView
            intensity={40}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
            style={[StyleSheet.absoluteFill, { backgroundColor: Colors.glass.overlay }]}
          />
          <Pressable onPress={(e) => e.stopPropagation()}>
            <GlassCard
              tone="surfaceStrong"
              intensity={50}
              padding="lg"
              borderRadius={Spacing.borderRadius.xl}
            >
              <View style={{ gap: Spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ ...Typography.preset.title, color: Colors.text.primary, fontWeight: Typography.weight.bold }}>
                체중 추이
              </Text>
              <TouchableOpacity onPress={() => setWeightModalOpen(false)} hitSlop={Spacing.hitSlop}>
                <Feather name="x" size={18} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            {weightStats ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    <Text style={{ ...Typography.preset.h2, color: Colors.text.primary }}>
                      {weightStats.latest.value}
                    </Text>
                    <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary }}>
                      {latestWeight?.unit ?? 'kg'}
                    </Text>
                  </View>
                  {weightStats.delta != null && weightStats.delta !== 0 ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      <Feather
                        name={weightStats.delta > 0 ? 'arrow-up' : 'arrow-down'}
                        size={11}
                        color={Colors.text.tertiary}
                      />
                      <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                        {Math.abs(weightStats.delta).toFixed(1)}{latestWeight?.unit ?? 'kg'}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                  {fmtDate(weightStats.latest.measuredAt, 'yyyy년 MM월 dd일')} 측정
                </Text>
                <MetricChart
                  data={weightStats.points}
                  unit={latestWeight?.unit ?? 'kg'}
                  width={Dimensions.get('window').width - Spacing.lg * 4}
                />
                <TouchableOpacity
                  onPress={() => {
                    setWeightModalOpen(false);
                    router.push({ pathname: '/records', params: { tab: 'metrics' } } as any);
                  }}
                  style={{ alignSelf: 'flex-end', paddingVertical: 4 }}
                  hitSlop={Spacing.hitSlop}
                >
                  <Text style={{ ...Typography.preset.caption, color: Colors.primaryDark, fontWeight: Typography.weight.semibold }}>
                    수치 탭에서 자세히 보기
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm }}>
                <Feather name="trending-up" size={24} color={Colors.text.tertiary} />
                <Text style={{ ...Typography.preset.body, color: Colors.text.secondary }}>
                  아직 체중 기록이 없어요
                </Text>
              </View>
            )}
              </View>
            </GlassCard>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Absolute glass header */}
      <View
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}
        pointerEvents="box-none"
      >
        <BlurView
          intensity={30}
          tint={isDark ? 'dark' : 'light'}
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        >
          <View style={{ paddingTop: insets.top, backgroundColor: Colors.glass.surface }}>
            <ScreenHeader
              title={pet.name}
              back
              variant="transparent"
              actions={[
                {
                  icon: 'edit-2',
                  label: '편집',
                  onPress: () => router.push({ pathname: '/pets/new', params: { petId } }),
                },
                // 공유받은 펫은 owner 만 삭제 가능 — UI 에서 미리 숨김.
                ...(pet.isShared
                  ? []
                  : [{ icon: 'trash-2' as const, label: '삭제', onPress: handleDelete }]),
              ]}
            />
          </View>
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: Colors.glass.border }} />
        </BlurView>
      </View>
    </View>
  );
}

function Section({
  title,
  onAction,
  actionLabel = '전체 보기',
  children,
}: {
  title: string;
  onAction?: () => void;
  actionLabel?: string;
  children: React.ReactNode;
}) {
  const Colors = useColors();
  return (
    <View style={{ marginTop: Spacing.xl }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: Spacing.xl,
          marginBottom: Spacing.md,
        }}
      >
        <Text style={{ ...Typography.preset.title, color: Colors.text.primary }}>{title}</Text>
        {onAction ? (
          <TouchableOpacity onPress={onAction} hitSlop={Spacing.hitSlop}>
            <Text style={{ ...Typography.preset.caption, color: Colors.primaryDark, fontWeight: Typography.weight.semibold }}>
              {actionLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function EmptyHint({ text }: { text: string }) {
  const Colors = useColors();
  return (
    <View style={{ paddingHorizontal: Spacing.xl }}>
      <View
        style={{
          padding: Spacing.lg,
          borderRadius: Spacing.borderRadius.lg,
          borderWidth: 1,
          borderColor: Colors.border,
          borderStyle: 'dashed',
          alignItems: 'center',
        }}
      >
        <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>{text}</Text>
      </View>
    </View>
  );
}
