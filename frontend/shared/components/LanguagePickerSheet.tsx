import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Spacing, Typography } from '../../constants';
import { useColors, useTheme } from '../hooks/useTheme';
import { useBottomSheetSafePadding } from '../hooks/useBottomSheetSafePadding';
import GlassOverlay from './GlassOverlay';
import { useLocaleStore, SUPPORTED_LOCALES, type AppLocale } from '../store/localeStore';

/**
 * 언어 선택 바텀시트. 테마와 달리 재시작 불필요 — setLocale → i18n.changeLanguage 구독으로
 * react-i18next 가 즉시 리렌더한다. 각 항목은 해당 언어의 자국어 명칭(한국어/English/日本語)으로 표기.
 */
export default function LanguagePickerSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const Colors = useColors();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const padBottom = useBottomSheetSafePadding(Spacing.xxxxl);

  const pick = (value: AppLocale) => {
    if (value !== locale) setLocale(value);
    onClose();
  };

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
                marginBottom: Spacing.sm,
              }}
            >
              {t('language.title')}
            </Text>
            {SUPPORTED_LOCALES.map((lng) => {
              const active = locale === lng;
              return (
                <TouchableOpacity
                  key={lng}
                  onPress={() => pick(lng)}
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
                  <Text
                    style={{
                      flex: 1,
                      ...Typography.preset.body,
                      color: active ? Colors.primaryDark : Colors.text.primary,
                      fontWeight: active ? Typography.weight.bold : Typography.weight.semibold,
                    }}
                  >
                    {t(`language.${lng}`)}
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
