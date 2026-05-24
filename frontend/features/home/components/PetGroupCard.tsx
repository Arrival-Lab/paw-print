import { View, Text, Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import Card from '../../../shared/components/Card';
import CircularProgress from '../../../shared/components/CircularProgress';
import TourTarget from '../../../shared/components/TourTarget';
import { TOUR_TARGETS } from '../../../shared/store/tourStore';
import { usePets } from '../../pet/hooks/usePets';
import type { Pet } from '../../pet/api/petApi';
import { usePetFilterStore } from '../../../shared/store/petFilterStore';
import { useRecentWeights, type RecentWeight } from '../../metric/hooks/useRecentWeights';
import { useFoodInfoMap } from '../../food/hooks/useFoodInfoMap';
import Badge from '../../../shared/components/Badge';

const SPECIES_PAW: Record<string, any> = {
  DOG: require('../../../assets/paws/dog.png'),
  CAT: require('../../../assets/paws/cat.png'),
  BIRD: require('../../../assets/paws/bird.png'),
  REPTILE: require('../../../assets/paws/reptile.png'),
  SMALL_ANIMAL: require('../../../assets/paws/small.png'),
  OTHER: require('../../../assets/paws/other.png'),
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

interface CareInfo { completed: number; total: number }

/**
 * 홈 메인 카드 — 모든 펫 row 를 한 번에 노출. 필터/selectedPet 분기 폐기.
 * 다이어리/수치/진료는 펫 상세 화면에 이미 다 있어서 홈에서 별도 필터링 의미 없음.
 * 펫 row 탭 → 펫 상세로 진입.
 */
export default function PetGroupCard({ careMap }: { careMap: Map<number, CareInfo> }) {
  const Colors = useColors();
  const { data } = usePets();
  const pets = data ?? [];
  const petIds = pets.map((p) => p.id);
  const weightMap = useRecentWeights(petIds);
  const foodMap = useFoodInfoMap(petIds);

  return (
    <TourTarget tourId={TOUR_TARGETS.HOME_PET_GROUP} wrap>
      <Card variant="elevated" padding="lg">
        {pets.length === 0 ? (
          <Text
            style={{
              ...Typography.preset.body,
              color: Colors.text.tertiary,
              textAlign: 'center',
              paddingVertical: Spacing.md,
            }}
          >
            펫 정보 없음
          </Text>
        ) : (
          <View style={{ gap: Spacing.lg }}>
            {pets.map((p) => (
              <PetRow
                key={p.id}
                pet={p}
                care={careMap.get(p.id) ?? { completed: 0, total: 0 }}
                weight={weightMap.get(p.id) ?? null}
                allergies={foodMap.get(p.id)?.allergies ?? []}
                forbiddenFoods={foodMap.get(p.id)?.forbiddenFoods ?? []}
              />
            ))}
          </View>
        )}
      </Card>
    </TourTarget>
  );
}

const PET_AVATAR_SIZE = 52;

function PetRow({
  pet, care, weight, allergies, forbiddenFoods,
}: {
  pet: Pet;
  care: CareInfo;
  weight: RecentWeight | null;
  allergies: string[];
  forbiddenFoods: string[];
}) {
  const Colors = useColors();
  const setSelectedPetId = usePetFilterStore((s) => s.setSelectedPetId);
  const age = ageFromBirthDate(pet.birthDate);

  const goToPetDetail = () => {
    router.push({ pathname: '/pets/[id]', params: { id: pet.id } });
  };

  const goToCare = () => {
    setSelectedPetId(pet.id);
    router.push({ pathname: '/(tabs)/daily', params: { tab: 'daily-check' } });
  };

  const hasBadges = allergies.length > 0 || forbiddenFoods.length > 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={goToPetDetail}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}
      >
        {pet.profileImage ? (
          <Image
            source={{ uri: pet.profileImage }}
            style={{
              width: PET_AVATAR_SIZE,
              height: PET_AVATAR_SIZE,
              borderRadius: PET_AVATAR_SIZE / 2,
            }}
          />
        ) : (
          <View
            style={{
              width: PET_AVATAR_SIZE,
              height: PET_AVATAR_SIZE,
              borderRadius: PET_AVATAR_SIZE / 2,
              backgroundColor: Colors.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              source={SPECIES_PAW[pet.species] ?? SPECIES_PAW.OTHER}
              style={{ width: PET_AVATAR_SIZE * 0.6, height: PET_AVATAR_SIZE * 0.6 }}
            />
          </View>
        )}
        {/* 가운데 영역: 위에 이름+나이+몸무게 한 줄, 아래에 알러지/금지음식 칩 */}
        <View style={{ flex: 1, gap: Spacing.xs }}>
          <Text
            style={{
              ...Typography.preset.title,
              fontWeight: Typography.weight.bold,
              color: Colors.text.primary,
            }}
          >
            {pet.name}
            {age ? (
              <Text
                style={{
                  ...Typography.preset.bodySmall,
                  fontWeight: Typography.weight.regular,
                  color: Colors.text.secondary,
                }}
              >
                {'  '}
                {age}
              </Text>
            ) : null}
            {weight != null ? (
              <Text
                style={{
                  ...Typography.preset.bodySmall,
                  fontWeight: Typography.weight.regular,
                  color: Colors.text.secondary,
                }}
              >
                {'  '}
                {weight.value}{weight.unit}
              </Text>
            ) : null}
          </Text>
          {hasBadges ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
              {allergies.length > 0 ? (
                <Badge tone="warning">⚠ 알러지 {allergies.length}</Badge>
              ) : null}
              {forbiddenFoods.length > 0 ? (
                <Badge tone="warning">🚫 금지음식 {forbiddenFoods.length}</Badge>
              ) : null}
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.85} onPress={goToCare}>
        <CircularProgress completed={care.completed} total={care.total} />
      </TouchableOpacity>
    </View>
  );
}

