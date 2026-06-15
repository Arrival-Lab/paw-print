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

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { value: 'system', label: '시스템', icon: 'smartphone' },
  { value: 'light', label: '라이트', icon: 'sun' },
  { value: 'dark', label: '다크', icon: 'moon' },
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
    { key: 'language', label: t('language.title'), icon: 'globe', rightText: t(`language.${locale}`), onPress: () => setShowLangPicker(true) },
    { key: 'notifications', label: '알림 설정', icon: 'bell', onPress: () => router.push('/notifications') },
  ];

  // App Store 5.1.1(v) — 계정 생성 가능 앱은 인앱 계정 삭제 필수.
  const handleDeleteAccount = () => {
    if (deleting) return;
    Alert.alert(
      '계정 삭제 안내',
      '계정을 삭제하면 다음 정보가 영구적으로 삭제되고 복구할 수 없어요.\n\n' +
        '• 등록한 모든 반려동물 프로필\n' +
        '• 진료기록·진료일정·예방접종 기록\n' +
        '• 건강 다이어리, 건강 수치, 일상 케어\n' +
        '• 커뮤니티 게시물·댓글·좋아요\n' +
        '• 케어 공유 관계\n' +
        '• 닉네임 등 계정 정보\n\n' +
        '※ App Store / Google Play 구독은 별도로 해지해야 해요. 계정 삭제만으로는 결제가 중단되지 않아요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '계속',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '정말 삭제할까요?',
              '이 작업은 되돌릴 수 없어요. 그래도 진행할까요?',
              [
                { text: '취소', style: 'cancel' },
                {
                  text: '계정 삭제',
                  style: 'destructive',
                  onPress: async () => {
                    if (deleting) return;
                    setDeleting(true);
                    try {
                      await deleteAccount();
                    } catch (e: any) {
                      setDeleting(false);
                      Alert.alert(
                        '삭제 실패',
                        e?.message ??
                          '잠시 후 다시 시도해주세요. 문제가 계속되면 chaeon.studio@gmail.com 으로 문의해주세요.',
                      );
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
              계정
            </Text>
            <Card variant="elevated" padding="none">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleDeleteAccount}
                accessibilityLabel="계정 삭제"
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
                  계정 삭제
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
