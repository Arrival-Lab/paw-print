import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, StyleSheet, Text, TextInput, Pressable, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { useColors, useTheme } from '../../../shared/hooks/useTheme';
import { Spacing, Typography } from '../../../constants';
import Button from '../../../shared/components/Button';
import GlassOverlay from '../../../shared/components/GlassOverlay';
import { useAcceptByCode } from '../hooks/useShare';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function InviteCodeDialog({ visible, onClose }: Props) {
  const Colors = useColors();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [code, setCode] = useState('');
  const { mutate: acceptByCode, isPending } = useAcceptByCode();

  const handleClose = () => {
    setCode('');
    onClose();
  };

  const handleSubmit = () => {
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      Alert.alert(t('action.confirm'), t('share.code6Required'));
      return;
    }
    acceptByCode(trimmed, {
      onSuccess: (res: any) => {
        Alert.alert(t('share.acceptDoneTitle'), t('share.acceptDoneMsg', { name: res?.petName ?? t('share.petFallback') }));
        handleClose();
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message;
        Alert.alert(t('share.acceptFailTitle'), msg ?? t('share.codeInvalid'));
      },
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <GlassOverlay
        onPress={handleClose}
        style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 360,
            borderRadius: Spacing.borderRadius.xl,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: Colors.glass.border,
          }}
        >
          <BlurView
            intensity={50}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: Colors.glass.surfaceStrong,
              padding: Spacing.xl,
              gap: Spacing.md,
            }}
          >
          <Text style={{ ...Typography.preset.heading, fontWeight: Typography.weight.bold, color: Colors.text.primary, textAlign: 'center' }}>
            {t('share.enterCodeTitle')}
          </Text>
          <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, textAlign: 'center' }}>
            {t('share.enterCodeDesc')}
          </Text>
          {/* 표시는 "123 456" 3-3 그룹, 내부 state 는 숫자만. maxLength 7 = 6자리 + 공백 1. */}
          <TextInput
            value={code.length > 3 ? `${code.slice(0, 3)} ${code.slice(3)}` : code}
            onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="123 456"
            placeholderTextColor={Colors.text.tertiary}
            keyboardType="number-pad"
            maxLength={7}
            autoFocus
            style={{
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: Spacing.borderRadius.md,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.md,
              fontSize: 28,
              letterSpacing: 2,
              textAlign: 'center',
              color: Colors.text.primary,
              backgroundColor: Colors.white,
              marginTop: Spacing.sm,
            }}
          />
          <Button onPress={handleSubmit} loading={isPending} variant="primary" fullWidth>
            {t('share.accept')}
          </Button>
          <Button onPress={handleClose} variant="ghost" fullWidth>
            {t('action.cancel')}
          </Button>
          </Pressable>
        </Pressable>
      </GlassOverlay>
    </Modal>
  );
}
