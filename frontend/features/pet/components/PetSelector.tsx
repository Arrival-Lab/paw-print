import { useEffect } from 'react';
import { ScrollView, TouchableOpacity, Text } from 'react-native';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import { usePetFilterStore } from '../../../shared/store/petFilterStore';
import { usePets } from '../hooks/usePets';

interface PetSelectorProps {
  onPetChange: (petId: number | null) => void;
  includeAll?: boolean;
}

export default function PetSelector({ onPetChange, includeAll = true }: PetSelectorProps) {
  const Colors = useColors();
  const { data: pets, isLoading } = usePets();
  const selectedPetId = usePetFilterStore((s) => s.selectedPetId);
  const setSelectedPetId = usePetFilterStore((s) => s.setSelectedPetId);

  useEffect(() => {
    onPetChange(selectedPetId);
  }, [selectedPetId]);

  useEffect(() => {
    if (!includeAll && selectedPetId === null && pets && pets.length > 0) {
      setSelectedPetId(pets[0].id);
    }
    if (selectedPetId !== null && pets && !pets.find((p) => p.id === selectedPetId)) {
      setSelectedPetId(includeAll ? null : pets[0]?.id ?? null);
    }
  }, [pets, includeAll]);

  if (isLoading || !pets?.length) return null;

  const handleSelect = (petId: number | null) => {
    setSelectedPetId(petId);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{ gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}
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
          onPress={() => handleSelect(pet.id)}
        />
      ))}
    </ScrollView>
  );
}

interface PetChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function PetChip({ label, selected, onPress }: PetChipProps) {
  const Colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: selected ? Colors.primary : Colors.surface,
        borderRadius: Spacing.borderRadius.full,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontSize: Typography.size.sm,
          fontWeight: Typography.weight.semibold,
          color: selected ? Colors.text.inverse : Colors.text.secondary,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
