import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      Alert.alert(t('auth.nickname.saveFailTitle'), e?.response?.data?.message ?? t('common.tryAgainLater'));
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
              {t('auth.nickname.setupTitle')}
            </Text>
            <Text style={{ ...Typography.preset.body, color: Colors.text.secondary }}>
              {t('auth.nickname.setupDesc')}
            </Text>
          </View>

          <View style={{ gap: Spacing.sm }}>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder={t('auth.nickname.placeholder')}
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
              {t('auth.nickname.rule')}
            </Text>
          </View>

          <View style={{ flex: 1 }} />

          <Button variant="primary" size="lg" disabled={!canSave} loading={saving} onPress={handleSave} fullWidth>
            {t('auth.nickname.start')}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
