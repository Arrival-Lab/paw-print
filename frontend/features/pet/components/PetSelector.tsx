import { useEffect } from 'react';
import { ScrollView, TouchableOpacity, Text, View, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import { usePetFilterStore } from '../../../shared/store/petFilterStore';
import { usePets } from '../hooks/usePets';

const SPECIES_PAW: Record<string, any> = {
  DOG: require('../../../assets/paws/dog.png'),
  CAT: require('../../../assets/paws/cat.png'),
  BIRD: require('../../../assets/paws/bird.png'),
  REPTILE: require('../../../assets/paws/reptile.png'),
  SMALL_ANIMAL: require('../../../assets/paws/small.png'),
  OTHER: require('../../../assets/paws/other.png'),
};

interface PetSelectorProps {
  onPetChange: (petId: number | null) => void;
  includeAll?: boolean;
  /** 가로 패딩 — 헤더 안에 들어갈 때 0 으로 줄 수 있음. 기본 Spacing.lg. */
  paddingHorizontal?: number;
  /** 세로 패딩 — 헤더 안에선 0, 본문에선 Spacing.sm. */
  paddingVertical?: number;
}

export default function PetSelector({
  onPetChange,
  includeAll = true,
  paddingHorizontal = Spacing.lg,
  paddingVertical = Spacing.sm,
}: PetSelectorProps) {
  const Colors = useColors();
  const { data: pets, isLoading } = usePets();
  const selectedPetId = usePetFilterStore((s) => s.selectedPetId);
  const setSelectedPetId = usePetFilterStore((s) => s.setSelectedPetId);

  useEffect(() => {
    onPetChange(selectedPetId);
  }, [selectedPetId]);

  useEffect(() => {
    // includeAll=false 인 화면(일상/건강)에서 store 가 null 로 리셋되면 첫 펫 자동 선택.
    // deps 에 selectedPetId 포함 — 각 탭 진입 시 useFocusEffect 가 null 로 만든 직후 이 effect 가
    // 재실행되어 첫 펫으로 떨어짐.
    if (!includeAll && selectedPetId === null && pets && pets.length > 0) {
      setSelectedPetId(pets[0].id);
    }
    if (selectedPetId !== null && pets && !pets.find((p) => p.id === selectedPetId)) {
      setSelectedPetId(includeAll ? null : pets[0]?.id ?? null);
    }
  }, [pets, includeAll, selectedPetId]);

  if (isLoading || !pets?.length) return null;

  const handleSelect = (petId: number | null) => {
    setSelectedPetId(petId);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{ gap: Spacing.sm, paddingHorizontal, paddingVertical }}
    >
      {includeAll ? (
        <PetChip
          label="전체"
          selected={selectedPetId === null}
          onPress={() => handleSelect(null)}
        />
      ) : null}
      {pets.map((pet) => (
        <PetChip
          key={pet.id}
          label={pet.name}
          selected={pet.id === selectedPetId}
          shared={!!pet.isShared}
          onPress={() => handleSelect(pet.id)}
        />
      ))}
    </ScrollView>
  );
}

interface PetChipProps {
  label: string;
  selected: boolean;
  shared?: boolean;
  onPress: () => void;
}

function PetChip({ label, selected, shared = false, onPress }: PetChipProps) {
  const Colors = useColors();
  const fg = selected ? Colors.text.inverse : Colors.text.secondary;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: selected ? Colors.primary : Colors.surface,
        borderRadius: Spacing.borderRadius.full,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        alignSelf: 'flex-start',
      }}
    >
      {shared ? <Feather name="users" size={11} color={fg} /> : null}
      <Text
        style={{
          fontSize: Typography.size.sm,
          fontWeight: Typography.weight.semibold,
          color: fg,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
