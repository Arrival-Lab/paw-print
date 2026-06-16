import { useTranslation } from 'react-i18next';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Spacing, Typography } from '../../constants';
import { useColors, useTheme } from '../hooks/useTheme';
import { useBottomSheetSafePadding } from '../hooks/useBottomSheetSafePadding';
import { useUiStore } from '../store/uiStore';
import GlassOverlay from './GlassOverlay';
import Button from './Button';

/**
 * 게스트가 계정 기능 탭 시 노출되는 로그인 권유 시트.
 * App Store 5.1.1(v) 대응 — 비-계정 기능은 그대로 두고, 계정 필요한 액션만 로그인 유도.
 * 사용: uiStore.showLoginPrompt('일기 작성은 로그인이 필요해요')
 */
export default function LoginPromptModal() {
  const Colors = useColors();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const padBottom = useBottomSheetSafePadding(Spacing.xxxxl);
  const visible = useUiStore((s) => s.isLoginPromptVisible);
  const message = useUiStore((s) => s.loginPromptMessage);
  const hide = useUiStore((s) => s.hideLoginPrompt);

  const goToLogin = () => {
    hide();
    router.push('/(auth)/login');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={hide} statusBarTranslucent>
      <GlassOverlay onPress={hide} style={{ justifyContent: 'flex-end' }}>
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
            <View
              style={{
                alignSelf: 'center',
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: Colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="log-in" size={26} color={Colors.primaryDark} />
            </View>
            <Text
              style={{
                ...Typography.preset.title,
                color: Colors.text.primary,
                fontWeight: Typography.weight.bold,
                textAlign: 'center',
              }}
            >
              {message}
            </Text>
            <Text
              style={{
                ...Typography.preset.bodySmall,
                color: Colors.text.secondary,
                textAlign: 'center',
                marginBottom: Spacing.sm,
              }}
            >
              {t('auth.promptDesc')}
            </Text>
            <Button variant="primary" fullWidth size="lg" onPress={goToLogin}>
              {t('auth.loginSignup')}
            </Button>
            <Button variant="ghost" fullWidth onPress={hide}>
              {t('auth.continueBrowsing')}
            </Button>
          </View>
        </Pressable>
      </GlassOverlay>
    </Modal>
  );
}
