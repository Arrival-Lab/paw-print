import { useState, useEffect } from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '../../../constants';
import { usePets } from '../hooks/usePets';

interface PetSelectorProps {
  onPetChange: (petId: number | null) => void;
  initialPetId?: number | null;
}

export default function PetSelector({ onPetChange, initialPetId = null }: PetSelectorProps) {
  const { data: pets, isLoading } = usePets();
  const [selectedPetId, setSelectedPetId] = useState<number | null>(initialPetId);

  useEffect(() => {
    if (pets && pets.length > 0 && selectedPetId === null) {
      setSelectedPetId(pets[0].id);
      onPetChange(pets[0].id);
    }
  }, [pets]);

  const handleSelect = (petId: number) => {
    setSelectedPetId(petId);
    onPetChange(petId);
  };

  if (isLoading || !pets?.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: Spacing.sm, paddingHorizontal: Spacing.lg }}
    >
      {pets.map((pet) => {
        const isSelected = pet.id === selectedPetId;
        return (
          <TouchableOpacity
            key={pet.id}
            onPress={() => handleSelect(pet.id)}
            style={{
              backgroundColor: isSelected ? Colors.primary : Colors.surface,
              borderRadius: Spacing.borderRadius.full,
              paddingVertical: Spacing.sm,
              paddingHorizontal: Spacing.lg,
            }}
          >
            <Text
              style={{
                fontSize: Typography.size.sm,
                fontWeight: Typography.weight.semibold,
                color: isSelected ? Colors.text.inverse : Colors.text.secondary,
              }}
            >
              {pet.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
