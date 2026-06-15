import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable, Alert, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Spacing, Typography } from '../constants';
import { useColors, useTheme } from '../shared/hooks/useTheme';
import { useBottomSheetSafePadding } from '../shared/hooks/useBottomSheetSafePadding';
import type { ThemeMode } from '../shared/store/themeStore';
import ScreenHeader from '../shared/components/ScreenHeader';
import Card from '../shared/components/Card';
import GlassOverlay from '../shared/components/GlassOverlay';
import LanguagePickerSheet from '../shared/components/LanguagePickerSheet';
import { useTranslation } from 'react-i18next';
import { useLocaleStore } from '../shared/store/localeStore';
import { reloadApp } from '../shared/utils/reload';
import { useAuthStore } from '../features/auth/store/authStore';
import { useAuth } from '../features/auth/hooks/useAuth';

const THEME_OPTIONS: { value: ThemeMode; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { value: 'system', icon: 'smartphone' },
  { value: 'light', icon: 'sun' },
  { value: 'dark', icon: 'moon' },
];

export default function SettingsScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const { mode: themeMode } = useTheme();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const isGuest = useAuthStore((s) => s.isGuest);
  const user = useAuthStore((s) => s.user);
  const { deleteAccount } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const currentThemeLabel = t(`theme.${themeMode}`);

  const rows: {
    key: string;
    label: string;
    icon: React.ComponentProps<typeof Feather>['name'];
    rightText?: string;
    onPress: () => void;
  }[] = [
    { key: 'theme', label: t('settings.theme'), icon: 'sun', rightText: currentThemeLabel, onPress: () => setShowThemePicker(true) },
    { key: 'language', label: t('language.title'), icon: 'globe', rightText: t(`language.${locale}`), onPress: () => setShowLangPicker(true) },
    { key: 'notifications', label: t('settings.notifications'), icon: 'bell', onPress: () => router.push('/notifications') },
  ];

  // App Store 5.1.1(v) — 계정 생성 가능 앱은 인앱 계정 삭제 필수.
  const handleDeleteAccount = () => {
    if (deleting) return;
    Alert.alert(
      t('account.deleteGuideTitle'),
      t('account.deleteGuideBody'),
      [
        { text: t('action.cancel'), style: 'cancel' },
        {
          text: t('action.continue'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('account.deleteConfirmTitle'),
              t('account.deleteConfirmBody'),
              [
                { text: t('action.cancel'), style: 'cancel' },
                {
                  text: t('settings.deleteAccount'),
                  style: 'destructive',
                  onPress: async () => {
                    if (deleting) return;
                    setDeleting(true);
                    try {
                      await deleteAccount();
                    } catch (e: any) {
                      setDeleting(false);
                      Alert.alert(t('account.deleteFailTitle'), e?.message ?? t('account.deleteFailBody'));
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  // 로그인된 사용자에게만 '계정' 섹션 노출 — 게스트는 삭제할 계정 자체가 없음.
  const showAccountSection = !isGuest && !!user;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }} edges={['top']}>
      <ScreenHeader title={t('settings.title')} back />
      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, paddingBottom: Spacing.xxxl }}>
        <Card variant="elevated" padding="none">
          {rows.map((row, idx) => (
            <TouchableOpacity
              key={row.key}
              activeOpacity={0.7}
              onPress={row.onPress}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.md,
                paddingHorizontal: Spacing.xl,
                paddingVertical: Spacing.lg,
                borderTopWidth: idx === 0 ? 0 : 1,
                borderTopColor: Colors.border,
              }}
            >
              <Feather name={row.icon} size={20} color={Colors.text.secondary} />
              <Text style={{ flex: 1, ...Typography.preset.body, color: Colors.text.primary }}>
                {row.label}
              </Text>
              {row.rightText ? (
                <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginRight: Spacing.xs }}>
                  {row.rightText}
                </Text>
              ) : null}
              <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
            </TouchableOpacity>
          ))}
        </Card>

        {showAccountSection ? (
          <View style={{ marginTop: Spacing.xl }}>
            <Text
              style={{
                ...Typography.preset.bodySmall,
                color: Colors.text.secondary,
                fontWeight: Typography.weight.bold,
                marginBottom: Spacing.sm,
              }}
            >
              {t('settings.account')}
            </Text>
            <Card variant="elevated" padding="none">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleDeleteAccount}
                accessibilityLabel={t('settings.deleteAccount')}
                accessibilityRole="button"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.md,
                  paddingHorizontal: Spacing.xl,
                  paddingVertical: Spacing.lg,
                }}
              >
                <Feather name="trash-2" size={20} color={Colors.status.error} />
                <Text style={{ flex: 1, ...Typography.preset.body, color: Colors.status.error }}>
                  {t('settings.deleteAccount')}
                </Text>
                <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
              </TouchableOpacity>
            </Card>
          </View>
        ) : null}
      </ScrollView>

      <ThemePickerSheet visible={showThemePicker} onClose={() => setShowThemePicker(false)} />
      <LanguagePickerSheet visible={showLangPicker} onClose={() => setShowLangPicker(false)} />
    </SafeAreaView>
  );
}

function ThemePickerSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const Colors = useColors();
  const { t } = useTranslation();
  const { isDark, mode, setMode } = useTheme();
  const padBottom = useBottomSheetSafePadding(Spacing.xxxxl);

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
              paddingTop: Spacing.md,
              paddingBottom: padBottom,
              paddingHorizontal: Spacing.xl,
              gap: Spacing.md,
            }}
          >
            <View
              style={{
                alignSelf: 'center',
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: Colors.border,
                marginBottom: Spacing.sm,
              }}
            />
            <Text
              style={{
                ...Typography.preset.title,
                color: Colors.text.primary,
                fontWeight: Typography.weight.bold,
                marginBottom: Spacing.xs,
              }}
            >
              {t('settings.theme')}
            </Text>
            <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginBottom: Spacing.sm }}>
              {t('theme.subtitle')}
            </Text>
            {THEME_OPTIONS.map((opt) => {
              const active = mode === opt.value;
              const handlePick = () => {
                if (active) {
                  onClose();
                  return;
                }
                Alert.alert(
                  t('theme.changeTitle'),
                  t('theme.changeBody'),
                  [
                    { text: t('action.cancel'), style: 'cancel' },
                    {
                      text: t('theme.restart'),
                      style: 'destructive',
                      onPress: async () => {
                        setMode(opt.value);
                        onClose();
                        try {
                          await reloadApp();
                        } catch (e: any) {
                          Alert.alert(t('theme.restartFailTitle'), e?.message ?? t('theme.restartFailBody'));
                        }
                      },
                    },
                  ],
                );
              };
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={handlePick}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.md,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: Spacing.md,
                    borderRadius: Spacing.borderRadius.lg,
                    backgroundColor: active ? Colors.primaryLight : 'transparent',
                  }}
                >
                  <Feather name={opt.icon} size={18} color={active ? Colors.primaryDark : Colors.text.secondary} />
                  <Text
                    style={{
                      flex: 1,
                      ...Typography.preset.body,
                      color: active ? Colors.primaryDark : Colors.text.primary,
                      fontWeight: active ? Typography.weight.bold : Typography.weight.semibold,
                    }}
                  >
                    {t(`theme.${opt.value}`)}
                  </Text>
                  {active ? <Feather name="check" size={18} color={Colors.primaryDark} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </GlassOverlay>
    </Modal>
  );
}
