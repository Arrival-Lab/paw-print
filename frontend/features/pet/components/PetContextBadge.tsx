import { useEffect, useRef } from 'react';
import { Animated, Image, Platform, Pressable, Text, Vibration, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import { usePetFilterStore } from '../../../shared/store/petFilterStore';
import { usePets } from '../hooks/usePets';
import type { Pet } from '../api/petApi';

const SPECIES_PAW: Record<Pet['species'], any> = {
  DOG: require('../../../assets/paws/dog.png'),
  CAT: require('../../../assets/paws/cat.png'),
  BIRD: require('../../../assets/paws/bird.png'),
  REPTILE: require('../../../assets/paws/reptile.png'),
  SMALL_ANIMAL: require('../../../assets/paws/small.png'),
  OTHER: require('../../../assets/paws/other.png'),
};

interface PetContextBadgeProps {
  /** 강제로 표시할 펫 id. 미지정 시 petFilterStore.selectedPetId 사용. */
  petId?: number | null;
  /** true 면 변경 불가 (쓰기/상세 화면용 — 현재 작업 중인 펫 표시 목적). */
  locked?: boolean;
  /** 탭 시 펫 변경 시트 열기. locked=false 일 때만 호출됨. */
  onPress?: () => void;
}

/**
 * 화면 상단 헤더에 "지금 보고/쓰고 있는 펫" 컨텍스트를 항상 노출.
 * - pets 로딩 중이거나 펫이 1마리뿐이면 렌더 안 함 (잡음 방지).
 * - "전체" 모드(petId=null)면 "전체 펫" 라벨로 표시.
 * - petFilterStore.lastChangedAt 변경 시 짧은 색 펄스 + 햅틱.
 */
export default function PetContextBadge({ petId, locked = false, onPress }: PetContextBadgeProps) {
  const Colors = useColors();
  const { data: pets } = usePets();
  const storePetId = usePetFilterStore((s) => s.selectedPetId);
  const lastChangedAt = usePetFilterStore((s) => s.lastChangedAt);
  const effectivePetId = petId !== undefined ? petId : storePetId;

  const pulse = useRef(new Animated.Value(0)).current;
  const initialMount = useRef(true);

  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    if (lastChangedAt === 0) return;
    // iOS: vibration permission 없이 짧은 tick. Android: 10ms 진동.
    if (Platform.OS !== 'web') Vibration.vibrate(10);
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 180, useNativeDriver: false }),
      Animated.timing(pulse, { toValue: 0, duration: 380, useNativeDriver: false }),
    ]).start();
  }, [lastChangedAt, pulse]);

  const petList = pets ?? [];
  if (petList.length <= 1) return null;

  const pet = effectivePetId == null ? null : petList.find((p) => p.id === effectivePetId) ?? null;
  const label = pet ? pet.name : '전체 펫';

  const animatedBg = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.primaryLight, Colors.primaryMuted],
  });

  const Wrapper: any = locked || !onPress ? View : Pressable;
  const wrapperProps = locked || !onPress ? {} : { onPress, hitSlop: Spacing.hitSlop };

  return (
    <Wrapper {...wrapperProps}>
      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.xs,
          paddingVertical: 4,
          paddingHorizontal: Spacing.sm,
          paddingRight: locked ? Spacing.sm : Spacing.xs,
          borderRadius: Spacing.borderRadius.full,
          backgroundColor: animatedBg,
          alignSelf: 'flex-start',
        }}
      >
        <Avatar pet={pet} />
        <Text
          numberOfLines={1}
          style={{
            ...Typography.preset.caption,
            color: Colors.primaryDark,
            fontWeight: Typography.weight.bold,
            maxWidth: 120,
          }}
        >
          {label}
        </Text>
        {pet?.isShared ? (
          <Feather name="users" size={11} color={Colors.primaryDark} />
        ) : null}
        {locked || !onPress ? null : (
          <Feather name="chevron-down" size={12} color={Colors.primaryDark} />
        )}
      </Animated.View>
    </Wrapper>
  );
}

function Avatar({ pet }: { pet: Pet | null }) {
  const Colors = useColors();
  const size = 20;
  if (pet?.profileImage) {
    return (
      <Image
        source={{ uri: pet.profileImage }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: Colors.surface }}
      />
    );
  }
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
      <Image
        source={pet ? SPECIES_PAW[pet.species] : SPECIES_PAW.OTHER}
        style={{ width: 12, height: 12 }}
        resizeMode="contain"
      />
    </View>
  );
}
