import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable, Alert, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Spacing, Typography } from '../constants';
import { useColors, useTheme } from '../shared/hooks/useTheme';
import type { ThemeMode } from '../shared/store/themeStore';
import ScreenHeader from '../shared/components/ScreenHeader';
import Card from '../shared/components/Card';
import GlassOverlay from '../shared/components/GlassOverlay';
import { reloadApp } from '../shared/utils/reload';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { value: 'system', label: '시스템', icon: 'smartphone' },
  { value: 'light', label: '라이트', icon: 'sun' },
  { value: 'dark', label: '다크', icon: 'moon' },
];

export default function SettingsScreen() {
  const Colors = useColors();
  const { mode: themeMode } = useTheme();
  const [showThemePicker, setShowThemePicker] = useState(false);

  const currentThemeLabel =
    themeMode === 'system' ? '시스템' : themeMode === 'light' ? '라이트' : '다크';

  const rows: {
    key: string;
    label: string;
    icon: React.ComponentProps<typeof Feather>['name'];
    rightText?: string;
    onPress: () => void;
  }[] = [
    { key: 'theme', label: '테마', icon: 'sun', rightText: currentThemeLabel, onPress: () => setShowThemePicker(true) },
    { key: 'notifications', label: '알림 설정', icon: 'bell', onPress: () => router.push('/notifications') },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }} edges={['top']}>
      <ScreenHeader title="설정" back />
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
      </ScrollView>

      <ThemePickerSheet visible={showThemePicker} onClose={() => setShowThemePicker(false)} />
    </SafeAreaView>
  );
}

function ThemePickerSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const Colors = useColors();
  const { isDark, mode, setMode } = useTheme();

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
              paddingBottom: Spacing.xxxxl,
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
              테마
            </Text>
            <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginBottom: Spacing.sm }}>
              시스템 설정을 따르거나 직접 선택하세요
            </Text>
            {THEME_OPTIONS.map((opt) => {
              const active = mode === opt.value;
              const handlePick = () => {
                if (active) {
                  onClose();
                  return;
                }
                Alert.alert(
                  '테마 변경',
                  '테마를 바꾸면 앱이 재시작돼요. 진행할까요?',
                  [
                    { text: '취소', style: 'cancel' },
                    {
                      text: '재시작',
                      style: 'destructive',
                      onPress: async () => {
                        setMode(opt.value);
                        onClose();
                        try {
                          await reloadApp();
                        } catch (e: any) {
                          Alert.alert('재시작 실패', e?.message ?? '앱을 직접 종료한 뒤 다시 열어주세요.');
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
                    {opt.label}
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
