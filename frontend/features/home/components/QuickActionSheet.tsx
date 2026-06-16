import { Modal, Platform, Pressable, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Spacing, Typography } from '../../../constants';
import { useColors, useTheme } from '../../../shared/hooks/useTheme';
import GlassOverlay from '../../../shared/components/GlassOverlay';
import { useBottomSheetSafePadding } from '../../../shared/hooks/useBottomSheetSafePadding';

interface Props {
  visible: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  firstPetId: number | null;
}

export default function QuickActionSheet({ visible, onClose, onNavigate, firstPetId }: Props) {
  const Colors = useColors();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const padBottom = useBottomSheetSafePadding();
  const apptPath = firstPetId ? `/appointments/new?petId=${firstPetId}` : '/(tabs)';
  // 진료기록·예방접종은 작성 화면으로 직접 진입해야 함. petId 가 없으면 진료 탭 fallback.
  const recordCreatePath = firstPetId ? `/records/create?petId=${firstPetId}` : '/(tabs)/health';
  const vaccineCreatePath = firstPetId ? `/vaccines?petId=${firstPetId}` : '/(tabs)/health?tab=vaccines';
  const actions = [
    { icon: 'zap' as const, label: t('home.quick.aiCheck'), desc: t('home.quick.aiCheckDesc'), path: '/symptom-check', accent: false },
    { icon: 'edit-3' as const, label: t('home.quick.diary'), desc: t('home.quick.diaryDesc'), path: '/diary', accent: false },
    { icon: 'file-text' as const, label: t('home.quick.record'), desc: t('home.quick.recordDesc'), path: recordCreatePath, accent: false },
    { icon: 'calendar' as const, label: t('home.quick.appt'), desc: t('home.quick.apptDesc'), path: apptPath, accent: false },
    { icon: 'shield' as const, label: t('home.quick.vaccine'), desc: t('home.quick.vaccineDesc'), path: vaccineCreatePath, accent: false },
    { icon: 'plus-square' as const, label: t('home.quick.emergency'), desc: t('home.quick.emergencyDesc'), path: '/hospital', accent: true },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <GlassOverlay onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            marginTop: 'auto',
            borderTopLeftRadius: Spacing.borderRadius.xxl,
            borderTopRightRadius: Spacing.borderRadius.xxl,
            overflow: 'hidden',
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: Colors.glass.border,
          }}
        >
          <BlurView
            intensity={50}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={{
              backgroundColor: Colors.glass.surfaceStrong,
              paddingHorizontal: Spacing.lg,
              paddingTop: Spacing.lg,
              paddingBottom: padBottom,
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
          <Text style={{ ...Typography.preset.h3, color: Colors.text.primary, marginBottom: Spacing.lg }}>
            {t('home.quickRecordTitle')}
          </Text>
          {actions.map((a, idx) => (
            <TouchableOpacity
              key={a.label}
              onPress={() => onNavigate(a.path)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.md,
                paddingVertical: Spacing.md,
                borderTopWidth: idx === 0 ? 0 : 1,
                borderTopColor: Colors.border,
              }}
            >
              <Feather
                name={a.icon}
                size={20}
                color={a.accent ? Colors.status.error : Colors.text.secondary}
                style={{ width: 24, textAlign: 'center' }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    ...Typography.preset.body,
                    color: a.accent ? Colors.status.error : Colors.text.primary,
                    fontWeight: Typography.weight.semibold,
                  }}
                >
                  {a.label}
                </Text>
                <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: 2 }}>
                  {a.desc}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={Colors.text.tertiary} />
            </TouchableOpacity>
          ))}
          </View>
        </Pressable>
      </GlassOverlay>
    </Modal>
  );
}
