import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Spacing, Typography, Config } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import ScreenHeader from '../../shared/components/ScreenHeader';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import Button from '../../shared/components/Button';
import { useRefresh } from '../../shared/hooks/useRefresh';
import { usePets } from '../../features/pet/hooks/usePets';
import { useAuthStore } from '../../features/auth/store/authStore';
import type { Pet } from '../../features/pet/api/petApi';

const SPECIES_PAW: Record<string, any> = {
  DOG: require('../../assets/paws/dog.png'),
  CAT: require('../../assets/paws/cat.png'),
  BIRD: require('../../assets/paws/bird.png'),
  REPTILE: require('../../assets/paws/reptile.png'),
  SMALL_ANIMAL: require('../../assets/paws/small.png'),
  OTHER: require('../../assets/paws/other.png'),
};

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

export default function PetsListScreen() {
  const Colors = useColors();
  const { data, isLoading } = usePets();
  const pets = (data ?? []) as unknown as Pet[];
  const isFree = useAuthStore((s) => s.user?.subscriptionType !== 'PREMIUM');
  const { refreshing, onRefresh } = useRefresh([['pets']]);
  const atLimit = isFree && pets.length >= Config.freeMaxPets;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }} edges={['top']}>
      <ScreenHeader title="반려동물 관리" back />
      {isLoading ? (
        <LoadingSpinner label="불러오는 중" />
      ) : pets.length === 0 ? (
        <EmptyState
          icon="heart"
          title="등록된 반려동물이 없어요"
          description="첫 반려동물을 등록해보세요"
          action={{ label: '반려동물 등록', onPress: () => router.push('/pets/new') }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, gap: Spacing.sm }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
          }
        >
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: Spacing.xs }}>
            <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
              {pets.length}{isFree ? ` / ${Config.freeMaxPets}` : ''}마리
            </Text>
          </View>
          {pets.map((pet) => (
            <PetRow key={pet.id} pet={pet} />
          ))}
          <View style={{ marginTop: Spacing.md }}>
            <Button
              variant="primary"
              icon="plus"
              onPress={() => router.push('/pets/new')}
              disabled={atLimit}
            >
              {atLimit ? `무료 ${Config.freeMaxPets}마리 한도 도달` : '반려동물 추가'}
            </Button>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function PetRow({ pet }: { pet: Pet }) {
  const Colors = useColors();
  const age = ageFromBirthDate(pet.birthDate);
  const meta = [age, SPECIES_LABEL[pet.species] ?? null].filter(Boolean).join(' · ');
  const shareLabel = pet.isShared
    ? `${pet.ownerName ?? '소유자'}님이 공유함`
    : pet.sharedMemberCount && pet.sharedMemberCount > 0
      ? `${pet.sharedMemberCount}명과 공유 중`
      : null;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/pets/[id]', params: { id: pet.id } })}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: Spacing.borderRadius.lg,
      }}
    >
      {pet.profileImage ? (
        <Image
          source={{ uri: pet.profileImage }}
          style={{ width: 48, height: 48, borderRadius: 24 }}
        />
      ) : (
        <View
          style={{
            width: 48, height: 48, borderRadius: 24,
            backgroundColor: Colors.primaryLight,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Image
            source={SPECIES_PAW[pet.species] ?? SPECIES_PAW.OTHER}
            style={{ width: 30, height: 30 }}
          />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ ...Typography.preset.body, fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>
          {pet.name}
        </Text>
        {meta ? (
          <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
            {meta}
          </Text>
        ) : null}
        {shareLabel ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Feather name="users" size={11} color={Colors.primaryDark} />
            <Text style={{ ...Typography.preset.caption, color: Colors.primaryDark, fontWeight: Typography.weight.semibold }}>
              {shareLabel}
            </Text>
          </View>
        ) : null}
      </View>
      <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
    </TouchableOpacity>
  );
}
