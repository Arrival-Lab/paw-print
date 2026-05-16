import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQueries } from '@tanstack/react-query';
import { Typography, Spacing, Config, Elevation } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import { useAuthStore } from '../../features/auth/store/authStore';
import { usePets } from '../../features/pet/hooks/usePets';
import { useUiStore } from '../../shared/store/uiStore';
import { vaccineApi, type Vaccine } from '../../features/vaccine/api/vaccineApi';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
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

export default function HomeScreen() {
  const Colors = useColors();
  const user = useAuthStore((s) => s.user);
  const { data: pets, isLoading: petsLoading } = usePets();
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);

  const isFree = user?.subscriptionType === 'FREE';

  const vaccineQueries = useQueries({
    queries: (pets ?? []).map((p) => ({
      queryKey: ['vaccines', p.id],
      queryFn: () => vaccineApi.getVaccines(p.id),
      enabled: !!pets?.length,
    })),
  });

  const upcomingVaccines = useMemo(() => {
    const items: { pet: { id: number; name: string }; vaccine: Vaccine }[] = [];
    (pets ?? []).forEach((p, idx) => {
      const data = vaccineQueries[idx]?.data;
      if (!data) return;
      data.forEach((v) => {
        if (v.dDay !== null && v.dDay >= 0 && v.dDay <= 30) {
          items.push({ pet: { id: p.id, name: p.name }, vaccine: v });
        }
      });
    });
    items.sort((a, b) => (a.vaccine.dDay ?? 0) - (b.vaccine.dDay ?? 0));
    return items.slice(0, 3);
  }, [pets, vaccineQueries.map((q) => q.dataUpdatedAt).join(',')]);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Spacing.xxxxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* 인사말 */}
        <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm }}>
          <Text style={{ ...Typography.preset.h2, color: Colors.text.primary }}>
            안녕하세요, {user.name}님 👋
          </Text>
          <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginTop: 4 }}>
            오늘도 반려동물과 행복한 하루 보내세요
          </Text>
        </View>

        {!petsLoading && !hasPets ? (
          <EmptyHero onAddPet={handleAddPet} />
        ) : (
          <>
            {/* 오늘 할 일 */}
            {upcomingVaccines.length > 0 && (
              <Section title="다가오는 일정">
                <View style={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm }}>
                  {upcomingVaccines.map(({ pet, vaccine }) => (
                    <UpcomingItem key={`${pet.id}-${vaccine.id}`} petName={pet.name} vaccine={vaccine} />
                  ))}
                </View>
              </Section>
            )}

            {/* 내 반려동물 */}
            <Section
              title="내 반려동물"
              right={
                <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                  {pets?.length ?? 0}{isFree ? ` / ${Config.freeMaxPets}` : ''}
                </Text>
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
                    onPress={() => router.push({ pathname: '/pets/new', params: { petId: pet.id } })}
                  />
                ))}
                <AddPetTile onPress={handleAddPet} />
              </ScrollView>
            </Section>

            {/* 빠른 액션 */}
            <Section title="기록 추가">
              <View style={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm }}>
                <QuickAction
                  icon="edit-3"
                  label="다이어리 작성"
                  description="오늘의 컨디션·식사·놀이 기록"
                  onPress={() => router.push('/diary')}
                />
                <QuickAction
                  icon="file-text"
                  label="진료기록 추가"
                  description="병원 방문·처방·OCR 등록"
                  onPress={() => router.push('/records')}
                />
                <QuickAction
                  icon="shield"
                  label="예방접종 등록"
                  description="다음 접종일 자동 알림"
                  onPress={() => router.push('/records')}
                />
              </View>
            </Section>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
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
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        width: 140,
        backgroundColor: Colors.white,
        borderRadius: Spacing.borderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        ...Elevation.card,
      }}
    >
      {pet.profileImage ? (
        <Image source={{ uri: pet.profileImage }} style={{ width: 72, height: 72, borderRadius: 36 }} />
      ) : (
        <InitialAvatar name={pet.name} size={72} />
      )}
      <Text
        numberOfLines={1}
        style={{ ...Typography.preset.title, color: Colors.text.primary, marginTop: Spacing.sm }}
      >
        {pet.name}
      </Text>
      <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: 2 }}>
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
      style={{
        width: 140,
        borderRadius: Spacing.borderRadius.lg,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: Colors.borderStrong,
        padding: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        minHeight: 140,
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
        <Feather name="plus" size={20} color={Colors.primary} />
      </View>
      <Text style={{ ...Typography.preset.bodyMedium, color: Colors.primary }}>반려동물 추가</Text>
    </TouchableOpacity>
  );
}

function QuickAction({
  icon, label, description, onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  description: string;
  onPress: () => void;
}) {
  const Colors = useColors();
  return (
    <Card variant="elevated" padding="md" onPress={onPress}>
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
          <Feather name={icon} size={18} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...Typography.preset.body, color: Colors.text.primary, fontWeight: Typography.weight.semibold }}>
            {label}
          </Text>
          <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
            {description}
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
      </View>
    </Card>
  );
}

function UpcomingItem({ petName, vaccine }: { petName: string; vaccine: Vaccine }) {
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
            {petName} · {vaccine.nextVaccineAt}
          </Text>
        </View>
        <Badge tone={tone}>{dDayLabel}</Badge>
      </View>
    </Card>
  );
}
