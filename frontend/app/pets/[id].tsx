import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Typography, Spacing, Elevation } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import { usePet } from '../../features/pet/hooks/usePets';
import { useRecords } from '../../features/record/hooks/useRecords';
import { useVaccines } from '../../features/vaccine/hooks/useVaccines';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

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

function InitialAvatar({ name, size }: { name: string; size: number }) {
  const Colors = useColors();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size / 2.4, fontWeight: Typography.weight.bold, color: Colors.primary }}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

export default function PetDetailScreen() {
  const Colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const petId = Number(id);
  const { data: pet, isLoading } = usePet(petId);
  const { data: recordsPage } = useRecords(petId);
  const { data: vaccines } = useVaccines(petId);

  const recentRecords = useMemo(
    () => (recordsPage?.pages.flatMap((p: any) => p.content) ?? []).slice(0, 3),
    [recordsPage],
  );

  const upcomingVaccines = useMemo(
    () => (vaccines ?? []).filter((v) => v.dDay !== null && v.dDay >= 0).slice(0, 3),
    [vaccines],
  );

  if (isLoading || !pet) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
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
                <InitialAvatar name={pet.name} size={96} />
              )}
              <Text style={{ ...Typography.preset.h2, color: Colors.text.primary, marginTop: Spacing.md }}>
                {pet.name}
              </Text>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                <Badge tone="primary">{SPECIES_LABEL[pet.species] ?? pet.species}</Badge>
                {age ? <Badge tone="neutral">{age}</Badge> : null}
                <Badge tone="neutral">{GENDER_LABEL[pet.gender]}</Badge>
              </View>
              {pet.breed ? (
                <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginTop: Spacing.sm }}>
                  {pet.breed}
                </Text>
              ) : null}
            </View>
          </Card>
        </View>

        {/* 빠른 액션 */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: Spacing.lg,
            marginTop: Spacing.lg,
            gap: Spacing.sm,
          }}
        >
          <QuickTile
            icon="edit-3"
            label="다이어리"
            onPress={() => router.push('/diary')}
          />
          <QuickTile
            icon="file-text"
            label="진료기록"
            onPress={() => router.push('/records')}
          />
          <QuickTile
            icon="shield"
            label="예방접종"
            onPress={() => router.push('/records')}
          />
        </View>

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
                  <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                    {r.visitedAt}
                  </Text>
                  <Text
                    style={{ ...Typography.preset.title, color: Colors.text.primary, marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {r.hospitalName ?? '병원 미입력'}
                  </Text>
                  {r.symptoms ? (
                    <Text
                      style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginTop: 4 }}
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
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  onAction,
  children,
}: {
  title: string;
  onAction?: () => void;
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
            <Text style={{ ...Typography.preset.caption, color: Colors.primary, fontWeight: Typography.weight.semibold }}>
              전체 보기
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function QuickTile({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
}) {
  const Colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: Spacing.borderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        gap: Spacing.sm,
        ...Elevation.card,
      }}
    >
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
        <Feather name={icon} size={20} color={Colors.primary} />
      </View>
      <Text style={{ ...Typography.preset.label, color: Colors.text.primary }}>{label}</Text>
    </TouchableOpacity>
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
        <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.tertiary }}>{text}</Text>
      </View>
    </View>
  );
}
