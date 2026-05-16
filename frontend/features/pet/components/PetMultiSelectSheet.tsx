import { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import { usePets } from '../hooks/usePets';

interface Props {
  visible: boolean;
  title: string;
  description?: string;
  initialPetIds?: number[];
  onClose: () => void;
  onConfirm: (petIds: number[]) => void;
}

export default function PetMultiSelectSheet({
  visible, title, description, initialPetIds, onClose, onConfirm,
}: Props) {
  const Colors = useColors();
  const { data: pets } = usePets();
  const [selected, setSelected] = useState<Set<number>>(new Set(initialPetIds ?? []));

  useEffect(() => {
    if (visible) setSelected(new Set(initialPetIds ?? []));
  }, [visible]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    if (selected.size === 0) return;
    onConfirm(Array.from(selected));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: Colors.overlay }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            marginTop: 'auto',
            backgroundColor: Colors.surfaceElevated,
            borderTopLeftRadius: Spacing.borderRadius.xxl,
            borderTopRightRadius: Spacing.borderRadius.xxl,
            paddingHorizontal: Spacing.lg,
            paddingTop: Spacing.lg,
            paddingBottom: Spacing.xxxl,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.border,
              marginBottom: Spacing.lg,
            }}
          />
          <Text style={{ ...Typography.preset.h3, color: Colors.text.primary, marginBottom: Spacing.xs }}>
            {title}
          </Text>
          {description ? (
            <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginBottom: Spacing.lg }}>
              {description}
            </Text>
          ) : <View style={{ height: Spacing.md }} />}

          <ScrollView style={{ maxHeight: 360 }}>
            {(pets ?? []).map((pet) => {
              const isOn = selected.has(pet.id);
              return (
                <TouchableOpacity
                  key={pet.id}
                  onPress={() => toggle(pet.id)}
                  activeOpacity={0.85}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: Spacing.md,
                    paddingHorizontal: Spacing.sm,
                    borderRadius: Spacing.borderRadius.md,
                    backgroundColor: isOn ? Colors.primaryLight : 'transparent',
                    marginBottom: Spacing.xs,
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: isOn ? Colors.primary : Colors.border,
                      backgroundColor: isOn ? Colors.primary : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: Spacing.md,
                    }}
                  >
                    {isOn ? <Feather name="check" size={16} color={Colors.white} /> : null}
                  </View>
                  <Text style={{ ...Typography.preset.body, color: Colors.text.primary, fontWeight: Typography.weight.semibold }}>
                    {pet.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            onPress={handleConfirm}
            disabled={selected.size === 0}
            activeOpacity={0.85}
            style={{
              marginTop: Spacing.lg,
              backgroundColor: selected.size === 0 ? Colors.borderStrong : Colors.primary,
              borderRadius: Spacing.borderRadius.lg,
              paddingVertical: Spacing.md,
              alignItems: 'center',
            }}
          >
            <Text style={{ ...Typography.preset.button, color: Colors.white }}>
              {selected.size > 1 ? `${selected.size}마리에 작성하기` : '작성하기'}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
