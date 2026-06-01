import { useState } from 'react';
import { View, Text, TextInput, Modal, Pressable, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { Typography, Spacing } from '../../../constants';
import { useColors, useTheme } from '../../../shared/hooks/useTheme';
import { useBottomSheetSafePadding } from '../../../shared/hooks/useBottomSheetSafePadding';
import Button from '../../../shared/components/Button';
import GlassOverlay from '../../../shared/components/GlassOverlay';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

const NICKNAME_RE = /^[가-힣a-zA-Z0-9_]{2,20}$/;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function NicknameEditModal({ visible, onClose }: Props) {
  const Colors = useColors();
  const { isDark } = useTheme();
  const padBottom = useBottomSheetSafePadding();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [value, setValue] = useState(user?.nickname ?? '');
  const [saving, setSaving] = useState(false);

  const trimmed = value.trim();
  const formatOk = NICKNAME_RE.test(trimmed);
  const unchanged = trimmed === (user?.nickname ?? '');
  const canSave = formatOk && !unchanged && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const updated = await authApi.updateNickname(trimmed);
      updateUser({ nickname: updated.nickname });
      onClose();
    } catch (e: any) {
      Alert.alert('닉네임 저장 실패', e?.response?.data?.message ?? '잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
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
                paddingHorizontal: Spacing.xl,
                paddingTop: Spacing.lg,
                paddingBottom: padBottom,
                gap: Spacing.lg,
              }}
            >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ ...Typography.preset.heading, color: Colors.text.primary }}>닉네임 설정</Text>
            <Pressable onPress={onClose} hitSlop={Spacing.hitSlop}>
              <Feather name="x" size={22} color={Colors.text.secondary} />
            </Pressable>
          </View>

          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
            커뮤니티·케어 공유에서 표시되는 이름이에요. 2~20자, 한글·영문·숫자·_ 만 사용할 수 있어요.
          </Text>

          <View>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="닉네임 입력"
              placeholderTextColor={Colors.text.tertiary}
              maxLength={20}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="none"
              autoComplete="off"
              style={{
                ...Typography.preset.body,
                color: Colors.text.primary,
                borderWidth: 1,
                borderColor: formatOk || trimmed.length === 0 ? Colors.border : Colors.status.error,
                borderRadius: Spacing.borderRadius.md,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.md,
              }}
            />
            {trimmed.length > 0 && !formatOk && (
              <Text style={{ ...Typography.preset.caption, color: Colors.status.error, marginTop: Spacing.xs }}>
                2~20자, 한글·영문·숫자·_ 만 가능해요.
              </Text>
            )}
          </View>

          <Button variant="primary" size="lg" disabled={!canSave} loading={saving} onPress={handleSave} fullWidth>
            저장
          </Button>
            </View>
          </Pressable>
        </GlassOverlay>
      </KeyboardAvoidingView>
    </Modal>
  );
}
