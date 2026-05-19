import { Modal, Pressable, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  firstPetId: number | null;
}

export default function QuickActionSheet({ visible, onClose, onNavigate, firstPetId }: Props) {
  const Colors = useColors();
  const apptPath = firstPetId ? `/appointments/new?petId=${firstPetId}` : '/(tabs)';
  const actions = [
    { icon: 'edit-3' as const, label: '다이어리 메모', desc: '오늘 하루 자유롭게', path: '/diary', accent: false },
    { icon: 'file-text' as const, label: '진료기록', desc: '병원 방문·처방전 사진', path: '/records', accent: false },
    { icon: 'calendar' as const, label: '병원 예약 추가', desc: '다음 방문 일정 + 알림', path: apptPath, accent: false },
    { icon: 'shield' as const, label: '예방접종 등록', desc: '다음 접종일 자동 알림', path: '/records', accent: false },
    { icon: 'plus-square' as const, label: '응급/24시 병원 찾기', desc: '내 위치 기준 가까운 곳', path: '/hospital', accent: true },
  ];

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
          <Text style={{ ...Typography.preset.h3, color: Colors.text.primary, marginBottom: Spacing.lg }}>
            무엇을 기록할까요?
          </Text>
          {actions.map((a) => (
            <TouchableOpacity
              key={a.label}
              onPress={() => onNavigate(a.path)}
              activeOpacity={0.85}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.md,
                paddingVertical: Spacing.md,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: a.accent ? Colors.status.errorBg : Colors.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name={a.icon} size={20} color={a.accent ? Colors.status.error : Colors.primary} />
              </View>
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
                <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                  {a.desc}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
