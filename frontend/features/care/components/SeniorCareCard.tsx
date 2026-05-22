import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors, useTheme } from '../../../shared/hooks/useTheme';
import GlassOverlay from '../../../shared/components/GlassOverlay';
import type { Pet } from '../../pet/api/petApi';
import { ageLabel, getLifeStage, isSeniorPet } from '../../pet/utils/lifeStage';
import { getSeniorTip } from '../data/seniorTips';

interface Props {
  pets: Pet[];
  /** true 면 가로 2-up split 용 컴팩트 row 형태. */
  compact?: boolean;
}

/**
 * 보이는 펫 중 7세+(시니어/노령) 가 있을 때만 노출.
 * 가장 나이 많은 시니어 펫 1마리 기준으로 팁 보여줌.
 * compact=true 면 홈 상단 가로 split 용 작은 row 로 렌더.
 */
export default function SeniorCareCard({ pets, compact = false }: Props) {
  const Colors = useColors();
  const [open, setOpen] = useState(false);

  const seniorPet = useMemo(() => {
    const seniors = pets.filter(isSeniorPet);
    if (seniors.length === 0) return null;
    return seniors.reduce((oldest, p) => {
      const oa = oldest.birthDate ? new Date(oldest.birthDate).getTime() : Infinity;
      const pa = p.birthDate ? new Date(p.birthDate).getTime() : Infinity;
      return pa < oa ? p : oldest;
    });
  }, [pets]);

  if (!seniorPet) return null;
  const stage = getLifeStage(seniorPet);
  if (!stage) return null;
  const tip = getSeniorTip(seniorPet, stage);
  if (!tip) return null;

  const stageLabel = stage === 'GERIATRIC' ? '노령기' : '시니어';

  const modal = (
    <SeniorTipModal
      visible={open}
      onClose={() => setOpen(false)}
      pet={seniorPet}
      stageLabel={stageLabel}
      tip={tip}
    />
  );

  if (compact) {
    return (
      <>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setOpen(true)}
          style={{
            backgroundColor: Colors.surface,
            borderRadius: Spacing.borderRadius.lg,
            paddingVertical: Spacing.sm,
            paddingHorizontal: Spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: Colors.secondaryLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="heart" size={14} color={Colors.text.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                ...Typography.preset.caption,
                color: Colors.text.tertiary,
                fontWeight: Typography.weight.semibold,
              }}
            >
              {seniorPet.name} · {ageLabel(seniorPet.birthDate)} · {stageLabel} 케어
            </Text>
            <Text
              numberOfLines={1}
              style={{
                ...Typography.preset.bodySmall,
                color: Colors.text.primary,
                fontWeight: Typography.weight.semibold,
                marginTop: 1,
              }}
            >
              {tip.title}
            </Text>
          </View>
          <Feather name="chevron-right" size={14} color={Colors.text.tertiary} />
        </TouchableOpacity>
        {modal}
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setOpen(true)}
        style={{
          backgroundColor: Colors.secondaryLight,
          borderRadius: Spacing.borderRadius.lg,
          padding: Spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.md,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: Colors.secondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather name="heart" size={20} color={Colors.text.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
            {seniorPet.name} · {ageLabel(seniorPet.birthDate)} · {stageLabel} 케어
          </Text>
          <Text numberOfLines={2} style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary, marginTop: 2 }}>
            {tip.title}
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
      </TouchableOpacity>
      {modal}
    </>
  );
}

function SeniorTipModal({
  visible,
  onClose,
  pet,
  stageLabel,
  tip,
}: {
  visible: boolean;
  onClose: () => void;
  pet: Pet;
  stageLabel: string;
  tip: ReturnType<typeof getSeniorTip>;
}) {
  const Colors = useColors();
  const { isDark } = useTheme();
  if (!tip) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <GlassOverlay onPress={onClose} style={{ justifyContent: 'flex-end' }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            borderTopLeftRadius: Spacing.borderRadius.xxl,
            borderTopRightRadius: Spacing.borderRadius.xxl,
            overflow: 'hidden',
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: Colors.glass.border,
            maxHeight: '88%',
          }}
        >
          <BlurView
            intensity={50}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ backgroundColor: Colors.glass.surfaceStrong, paddingTop: Spacing.md, paddingBottom: Spacing.xxxl }}>
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
            <Pressable onPress={onClose} hitSlop={Spacing.hitSlop} style={{ position: 'absolute', top: Spacing.lg, right: Spacing.lg, zIndex: 1 }}>
              <Feather name="x" size={22} color={Colors.text.secondary} />
            </Pressable>

            <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.xl }}>
              <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginBottom: 4 }}>
                {pet.name} · {ageLabel(pet.birthDate)} · {stageLabel} 케어
              </Text>
              <Text style={{ ...Typography.preset.h2, color: Colors.text.primary }}>{tip.title}</Text>
              <Text
                style={{
                  marginTop: Spacing.md,
                  ...Typography.preset.body,
                  color: Colors.text.secondary,
                  lineHeight: Typography.size.md * Typography.lineHeight.relaxed,
                }}
              >
                {tip.body}
              </Text>

              {tip.checkupCadence ? (
                <View style={{ marginTop: Spacing.lg, padding: Spacing.lg, backgroundColor: Colors.primaryLight, borderRadius: Spacing.borderRadius.lg, flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
                  <Feather name="calendar" size={16} color={Colors.text.accent} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...Typography.preset.label, color: Colors.text.tertiary }}>권장 검진 주기</Text>
                    <Text style={{ marginTop: 2, ...Typography.preset.bodyMedium, color: Colors.text.primary }}>
                      {tip.checkupCadence}
                    </Text>
                  </View>
                </View>
              ) : null}

              <Text style={{ marginTop: Spacing.xl, ...Typography.preset.label, color: Colors.text.tertiary }}>
                집에서 체크해볼 신호
              </Text>
              <View style={{ marginTop: Spacing.sm, gap: Spacing.sm }}>
                {tip.watchFor.map((w, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: Colors.primary,
                        marginTop: 8,
                      }}
                    />
                    <Text style={{ flex: 1, ...Typography.preset.body, color: Colors.text.primary }}>{w}</Text>
                  </View>
                ))}
              </View>

              <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: Spacing.xl, textAlign: 'center' }}>
                일반 가이드 정보예요. 정확한 진단은 수의사와 상담해주세요.
              </Text>
            </ScrollView>
          </View>
        </Pressable>
      </GlassOverlay>
    </Modal>
  );
}
