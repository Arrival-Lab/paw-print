import { View, Text, Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import Card from '../../../shared/components/Card';
import TourTarget from '../../../shared/components/TourTarget';
import { TOUR_TARGETS } from '../../../shared/store/tourStore';
import { usePets } from '../../pet/hooks/usePets';
import type { Pet } from '../../pet/api/petApi';
import { petColorOf } from '../../pet/constants/petColors';
import { usePetFilterStore } from '../../../shared/store/petFilterStore';

const SPECIES_PAW: Record<string, any> = {
  DOG: require('../../../assets/paws/dog.png'),
  CAT: require('../../../assets/paws/cat.png'),
  BIRD: require('../../../assets/paws/bird.png'),
  REPTILE: require('../../../assets/paws/reptile.png'),
  SMALL_ANIMAL: require('../../../assets/paws/small.png'),
  OTHER: require('../../../assets/paws/other.png'),
};

interface CareInfo { completed: number; total: number }

/**
 * 홈 메인 — 펫별 "오늘 한 줄 요약" 런처.
 * 홈은 다른 탭 콘텐츠를 그대로 얹지 않고(지저분함의 원인), 펫마다 한 줄로 오늘 상태만
 * 요약해 보여주고 탭하면 해당 펫의 할 일 화면으로 보낸다. 펫이 늘어도 한 줄씩이라 안 쌓인다.
 * 색은 펫 식별 색(캘린더 마커와 동일) — 어떤 펫인지 한눈에.
 */
export default function PetGroupCard({
  careMap,
  todayApptByPet,
}: {
  careMap: Map<number, CareInfo>;
  todayApptByPet: Map<number, number>;
}) {
  const Colors = useColors();
  const { data } = usePets();
  const pets = data ?? [];

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
                todayAppt={todayApptByPet.get(p.id) ?? 0}
              />
            ))}
          </View>
        )}
      </Card>
    </TourTarget>
  );
}

const PET_AVATAR_SIZE = 46;

// 오늘 상태 한 줄 — 일정·할 일 요약 + 톤(완료/보통/없음).
function todayStatus(care: CareInfo, todayAppt: number): { text: string; tone: 'success' | 'normal' | 'muted' } {
  const remaining = Math.max(care.total - care.completed, 0);
  const allCareDone = care.total > 0 && remaining === 0;
  const nothing = care.total === 0 && todayAppt === 0;

  if (nothing) return { text: '오늘은 예정된 일이 없어요', tone: 'muted' };
  if (allCareDone && todayAppt === 0) return { text: '오늘 할 일 완료 🎉', tone: 'success' };

  const segs: string[] = [];
  if (todayAppt > 0) segs.push(`일정 ${todayAppt}개`);
  if (remaining > 0) segs.push(`할 일 ${remaining}개`);
  else if (care.total > 0) segs.push('할 일 완료');
  return { text: segs.join(' · '), tone: 'normal' };
}

function PetRow({ pet, care, todayAppt }: { pet: Pet; care: CareInfo; todayAppt: number }) {
  const Colors = useColors();
  const setSelectedPetId = usePetFilterStore((s) => s.setSelectedPetId);
  const color = petColorOf(pet);
  const status = todayStatus(care, todayAppt);
  const statusColor =
    status.tone === 'success' ? Colors.status.success
    : status.tone === 'muted' ? Colors.text.tertiary
    : Colors.text.secondary;

  // 탭 → 그 펫의 오늘 할 일 화면(일상·매일체크). 거기서 완료하면 다음 진입 시 멘트가 바뀐다.
  const onPress = () => {
    setSelectedPetId(pet.id);
    router.push({ pathname: '/(tabs)/daily', params: { tab: 'daily-check' } });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}
    >
      {/* 아바타 — 펫 색 ring 으로 식별 */}
      {pet.profileImage ? (
        <Image
          source={{ uri: pet.profileImage }}
          style={{
            width: PET_AVATAR_SIZE,
            height: PET_AVATAR_SIZE,
            borderRadius: PET_AVATAR_SIZE / 2,
            borderWidth: 2,
            borderColor: color,
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
            borderWidth: 2,
            borderColor: color,
          }}
        >
          <Image
            source={SPECIES_PAW[pet.species] ?? SPECIES_PAW.OTHER}
            style={{ width: PET_AVATAR_SIZE * 0.58, height: PET_AVATAR_SIZE * 0.58 }}
          />
        </View>
      )}

      {/* 이름 + 오늘 상태 한 줄 */}
      <View style={{ flex: 1 }}>
        <Text
          style={{ ...Typography.preset.bodyMedium, fontWeight: Typography.weight.bold, color: Colors.text.primary }}
        >
          {pet.name}
        </Text>
        <Text style={{ ...Typography.preset.caption, color: statusColor, marginTop: 2 }} numberOfLines={1}>
          {status.text}
        </Text>
      </View>

      <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
    </TouchableOpacity>
  );
}
