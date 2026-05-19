import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Alert, KeyboardAvoidingView, Platform, BackHandler, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Typography, Spacing } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import Button from '../../shared/components/Button';
import { authApi } from '../../features/auth/api/authApi';
import { useAuthStore } from '../../features/auth/store/authStore';

const NICKNAME_RE = /^[가-힣a-zA-Z0-9_]{2,20}$/;

export default function NicknameSetupScreen() {
  const Colors = useColors();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  // 안드로이드 하드웨어 back 차단 — 닉네임 설정 전 빠져나갈 수 없음.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // 이미 nickname 있는 사용자가 직접 진입했으면 메인으로 보냄.
  useEffect(() => {
    if (user?.nickname) router.replace('/(tabs)');
  }, [user?.nickname]);

  const trimmed = value.trim();
  const formatOk = NICKNAME_RE.test(trimmed);
  const canSave = formatOk && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const updated = await authApi.updateNickname(trimmed);
      updateUser({ nickname: updated.nickname });
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('닉네임 저장 실패', e?.response?.data?.message ?? '잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, paddingBottom: Spacing.xxl, gap: Spacing.xl }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ gap: Spacing.sm }}>
            <Text style={{ ...Typography.preset.display, color: Colors.text.primary }}>
              사용할 닉네임을{'\n'}알려주세요
            </Text>
            <Text style={{ ...Typography.preset.body, color: Colors.text.secondary }}>
              커뮤니티·케어 공유에서 다른 사용자에게 보이는 이름이에요. 실명·이메일은 나만 봐요.
            </Text>
          </View>

          <View style={{ gap: Spacing.sm }}>
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
              autoFocus
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
            <Text
              style={{
                ...Typography.preset.caption,
                color: trimmed.length > 0 && !formatOk ? Colors.status.error : Colors.text.tertiary,
              }}
            >
              2~20자, 한글·영문·숫자·_ 만 사용할 수 있어요.
            </Text>
          </View>

          <View style={{ flex: 1 }} />

          <Button variant="primary" size="lg" disabled={!canSave} loading={saving} onPress={handleSave} fullWidth>
            시작하기
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
