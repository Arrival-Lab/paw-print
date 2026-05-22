import { Modal, Platform, Pressable, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors, useTheme } from '../../../shared/hooks/useTheme';
import GlassOverlay from '../../../shared/components/GlassOverlay';

interface Props {
  visible: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  firstPetId: number | null;
}

export default function QuickActionSheet({ visible, onClose, onNavigate, firstPetId }: Props) {
  const Colors = useColors();
  const { isDark } = useTheme();
  const apptPath = firstPetId ? `/appointments/new?petId=${firstPetId}` : '/(tabs)';
  // 진료기록·예방접종은 작성 화면으로 직접 진입해야 함. petId 가 없으면 진료 탭 fallback.
  const recordCreatePath = firstPetId ? `/records/create?petId=${firstPetId}` : '/(tabs)/health';
  const vaccineCreatePath = firstPetId ? `/vaccines?petId=${firstPetId}` : '/(tabs)/health?tab=vaccines';
  const actions = [
    { icon: 'zap' as const, label: 'AI 증상 빠른 체크', desc: '어디가 아픈지 모르겠을 때', path: '/symptom-check', accent: false },
    { icon: 'edit-3' as const, label: '다이어리 메모', desc: '오늘 하루 자유롭게', path: '/diary', accent: false },
    { icon: 'file-text' as const, label: '진료기록', desc: '병원 방문·처방전 사진', path: recordCreatePath, accent: false },
    { icon: 'calendar' as const, label: '병원 예약 추가', desc: '다음 방문 일정 + 알림', path: apptPath, accent: false },
    { icon: 'shield' as const, label: '예방접종 등록', desc: '다음 접종일 자동 알림', path: vaccineCreatePath, accent: false },
    { icon: 'plus-square' as const, label: '응급/24시 병원 찾기', desc: '내 위치 기준 가까운 곳', path: '/hospital', accent: true },
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
          <Text style={{ ...Typography.preset.h3, color: Colors.text.primary, marginBottom: Spacing.lg }}>
            무엇을 기록할까요?
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
