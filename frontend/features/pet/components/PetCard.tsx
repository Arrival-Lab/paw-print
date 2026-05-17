import { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography, Elevation } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import type { Pet } from '../api/petApi';

const SPECIES_PAW: Record<string, any> = {
  DOG: require('../../../assets/paws/dog.png'),
  CAT: require('../../../assets/paws/cat.png'),
  BIRD: require('../../../assets/paws/bird.png'),
  REPTILE: require('../../../assets/paws/reptile.png'),
  SMALL_ANIMAL: require('../../../assets/paws/small.png'),
  OTHER: require('../../../assets/paws/other.png'),
};

interface Props {
  pet: Pet;
  onPress: () => void;
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

/**
 * 공통 펫 카드 — 홈/더보기 등에서 재사용.
 * 72px 원형 + 이름 + (공유 펫이면 "○○님 공유" / 아니면 나이).
 */
export default function PetCard({ pet, onPress }: Props) {
  const Colors = useColors();
  const age = ageFromBirthDate(pet.birthDate);
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
          backgroundColor: Colors.surface,
          padding: 3,
          alignItems: 'center',
          justifyContent: 'center',
          ...Elevation.card,
        }}
      >
        {showImage ? (
          <Image
            source={{ uri: pet.profileImage as string }}
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

/**
 * "+추가" 타일 — 펫 카드 옆에 동일 사이즈로. locked=true 면 프리미엄 자물쇠.
 */
export function AddPetTile({ onPress, locked = false }: { onPress: () => void; locked?: boolean }) {
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
      </View>
      <Text
        style={{ ...Typography.preset.bodyMedium, color: locked ? Colors.premium : Colors.primary, marginTop: Spacing.sm }}
      >
        {locked ? '프리미엄' : '추가'}
      </Text>
    </TouchableOpacity>
  );
}
