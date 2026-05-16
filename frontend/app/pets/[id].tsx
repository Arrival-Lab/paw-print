import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Typography, Spacing, Elevation } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import { usePet } from '../../features/pet/hooks/usePets';
import { useRecords } from '../../features/record/hooks/useRecords';
import { useVaccines } from '../../features/vaccine/hooks/useVaccines';
import { useMetricChart, useMetrics } from '../../features/metric/hooks/useMetrics';
import { useRecentDiaries } from '../../features/diary/hooks/useRecentDiaries';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
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

function daysAgoLabel(iso: string): string {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return '오늘';
  if (diff === 1) return '어제';
  return `${diff}일 전`;
}

export default function PetDetailScreen() {
  const Colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const petId = Number(id);
  const { data: pet, isLoading } = usePet(petId);
  const { data: recordsPage } = useRecords(petId);
  const { data: vaccines } = useVaccines(petId);
  const { data: weightChart } = useMetricChart(petId, 'WEIGHT');
  const { data: weightPage } = useMetrics(petId, 'WEIGHT');
  const { data: recentDiaries } = useRecentDiaries(petId, { limit: 6 });

  const recentRecords = useMemo(
    () => (recordsPage?.pages.flatMap((p: any) => p.content) ?? []).slice(0, 3),
    [recordsPage],
  );

  const upcomingVaccines = useMemo(
    () => (vaccines ?? []).filter((v) => v.dDay !== null && v.dDay >= 0).slice(0, 3),
    [vaccines],
  );

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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }} edges={['top']}>
      <ScreenHeader
        title={pet.name}
        back
        actions={[
          {
            icon: 'edit-2',
            label: '편집',
            onPress: () => router.push({ pathname: '/pets/new', params: { petId } }),
          },
        ]}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xxxxl }} showsVerticalScrollIndicator={false}>
        {/* 프로필 */}
        <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }}>
          <Card variant="elevated" padding="lg">
            <View style={{ alignItems: 'center' }}>
              {pet.profileImage ? (
                <Image source={{ uri: pet.profileImage }} style={{ width: 96, height: 96, borderRadius: 48 }} />
              ) : (
                <InitialAvatar name={pet.name} size={96} species={pet.species} />
              )}
              <Text style={{ ...Typography.preset.heading, color: Colors.text.primary, marginTop: Spacing.md }}>
                {pet.name}
              </Text>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Badge tone="primary">{SPECIES_LABEL[pet.species] ?? pet.species}</Badge>
                {age ? <Badge tone="neutral">{age}</Badge> : null}
                <Badge tone="neutral">{GENDER_LABEL[pet.gender]}</Badge>
                {latestWeight ? <Badge tone="neutral">{latestWeight.value}{latestWeight.unit ?? 'kg'}</Badge> : null}
              </View>
              {pet.breed ? (
                <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: Spacing.sm }}>
                  {pet.breed}
                </Text>
              ) : null}
            </View>
          </Card>
        </View>

        {/* 체중 추이 */}
        <Section
          title="체중 추이"
          onAction={() => router.push('/records')}
          actionLabel="기록 추가"
        >
          <View style={{ paddingHorizontal: Spacing.lg }}>
            <Card variant="elevated" padding="lg">
              {weightStats ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm }}>
                    <Text style={{ ...Typography.preset.heading, color: Colors.text.primary }}>
                      {weightStats.latest.value}
                    </Text>
                    <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary }}>
                      {latestWeight?.unit ?? 'kg'}
                    </Text>
                    {weightStats.delta != null && weightStats.delta !== 0 ? (
                      <Text
                        style={{
                          ...Typography.preset.caption,
                          color: weightStats.delta > 0 ? Colors.status.warning : Colors.status.success,
                          marginLeft: Spacing.sm,
                          fontWeight: Typography.weight.semibold,
                        }}
                      >
                        {weightStats.delta > 0 ? '▲' : '▼'} {Math.abs(weightStats.delta).toFixed(1)}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: 2 }}>
                    {fmtDate(weightStats.latest.measuredAt, 'yyyy년 MM월 dd일')} 측정
                  </Text>
                  <Sparkline
                    values={weightStats.points.map((p) => p.value)}
                    color={Colors.primary}
                    style={{ marginTop: Spacing.md }}
                  />
                </>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: Spacing.md }}>
                  <Feather name="trending-up" size={24} color={Colors.text.tertiary} />
                  <Text style={{ ...Typography.preset.body, color: Colors.text.secondary, marginTop: Spacing.sm }}>
                    체중 기록을 시작해보세요
                  </Text>
                  <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: 2, textAlign: 'center' }}>
                    꾸준히 기록하면 변화 추이가 한눈에 보여요
                  </Text>
                </View>
              )}
            </Card>
          </View>
        </Section>

        {/* 다가오는 백신 */}
        <Section title="다가오는 예방접종" onAction={() => router.push('/records')}>
          {upcomingVaccines.length === 0 ? (
            <EmptyHint text="예정된 접종이 없어요" />
          ) : (
            <View style={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm }}>
              {upcomingVaccines.map((v) => (
                <Card key={v.id} variant="elevated" padding="md">
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...Typography.preset.body, color: Colors.text.primary, fontWeight: Typography.weight.semibold }}>
                        {v.vaccineName}
                      </Text>
                      <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                        {v.nextVaccineAt}
                      </Text>
                    </View>
                    <Badge tone={v.dDay !== null && v.dDay <= 7 ? 'warning' : 'primary'}>
                      {v.dDay === 0 ? '오늘' : `D-${v.dDay}`}
                    </Badge>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </Section>

        {/* 최근 진료기록 */}
        <Section title="최근 진료기록" onAction={() => router.push('/records')}>
          {recentRecords.length === 0 ? (
            <EmptyHint text="아직 진료기록이 없어요" />
          ) : (
            <View style={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm }}>
              {recentRecords.map((r: any) => (
                <Card
                  key={r.id}
                  variant="elevated"
                  padding="md"
                  onPress={() => router.push({ pathname: '/records/[id]', params: { id: r.id, petId } })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                      {fmtDate(r.visitedAt, 'yyyy년 MM월 dd일')}
                    </Text>
                    <Text style={{ ...Typography.preset.caption, color: Colors.primaryDark, fontWeight: Typography.weight.semibold }}>
                      {daysAgoLabel(r.visitedAt)}
                    </Text>
                  </View>
                  <Text
                    style={{ ...Typography.preset.body, color: Colors.text.primary, fontWeight: Typography.weight.semibold, marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {r.hospitalName ?? '병원 미입력'}
                  </Text>
                  {r.symptoms ? (
                    <Text
                      style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}
                      numberOfLines={1}
                    >
                      {r.symptoms}
                    </Text>
                  ) : null}
                </Card>
              ))}
            </View>
          )}
        </Section>

        {/* 최근 다이어리 사진 */}
        <Section title="최근 다이어리" onAction={() => router.push('/diary')}>
          {diaryPhotos.length === 0 ? (
            <EmptyHint text="사진과 함께 하루를 기록해보세요" />
          ) : (
            <View
              style={{
                paddingHorizontal: Spacing.lg,
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
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Sparkline({
  values, color, style,
}: { values: number[]; color: string; style?: any }) {
  const Colors = useColors();
  const width = Dimensions.get('window').width - Spacing.lg * 2 - Spacing.lg * 2;
  const height = 56;
  if (values.length < 2) {
    return (
      <View style={[{ height, justifyContent: 'center' }, style]}>
        <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
          최소 2회 측정해야 추이가 표시돼요
        </Text>
      </View>
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => ({
    x: i * step,
    y: height - ((v - min) / range) * (height - 8) - 4,
  }));

  return (
    <View style={[{ width, height }, style]}>
      {points.map((p, i) => {
        if (i === points.length - 1) {
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: p.x - 3,
                top: p.y - 3,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: color,
              }}
            />
          );
        }
        const next = points[i + 1];
        const dx = next.x - p.x;
        const dy = next.y - p.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: length,
              height: 2,
              backgroundColor: color,
              transform: [{ translateY: -1 }, { rotate: `${angle}deg` }],
              transformOrigin: '0 50%',
            }}
          />
        );
      })}
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
          paddingHorizontal: Spacing.lg,
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
    <View style={{ paddingHorizontal: Spacing.lg }}>
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
