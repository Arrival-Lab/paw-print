import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, Alert } from 'react-native';
import { useColors } from '../../../shared/hooks/useTheme';
import { Spacing, Typography } from '../../../constants';
import Button from '../../../shared/components/Button';
import { useAcceptByCode } from '../hooks/useShare';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function InviteCodeDialog({ visible, onClose }: Props) {
  const Colors = useColors();
  const [code, setCode] = useState('');
  const { mutate: acceptByCode, isPending } = useAcceptByCode();

  const handleClose = () => {
    setCode('');
    onClose();
  };

  const handleSubmit = () => {
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      Alert.alert('확인', '6자리 숫자 코드를 입력해주세요.');
      return;
    }
    acceptByCode(trimmed, {
      onSuccess: (res: any) => {
        Alert.alert('수락 완료', `${res?.petName ?? '반려동물'} 공유를 수락했어요.`);
        handleClose();
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message;
        Alert.alert('수락 실패', msg ?? '코드가 만료되었거나 잘못된 코드일 수 있어요.');
      },
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable
        onPress={handleClose}
        style={{
          flex: 1,
          backgroundColor: Colors.overlay,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: Spacing.xl,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 360,
            backgroundColor: Colors.surfaceElevated,
            borderRadius: Spacing.borderRadius.xl,
            padding: Spacing.xl,
            gap: Spacing.md,
          }}
        >
          <Text style={{ ...Typography.preset.heading, fontWeight: Typography.weight.bold, color: Colors.text.primary, textAlign: 'center' }}>
            초대 코드 입력
          </Text>
          <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, textAlign: 'center' }}>
            받은 6자리 숫자 코드를 입력해주세요
          </Text>
          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="123456"
            placeholderTextColor={Colors.text.tertiary}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            style={{
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: Spacing.borderRadius.md,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.md,
              fontSize: 28,
              letterSpacing: 8,
              textAlign: 'center',
              color: Colors.text.primary,
              backgroundColor: Colors.white,
              marginTop: Spacing.sm,
            }}
          />
          <Button onPress={handleSubmit} loading={isPending} variant="primary" fullWidth>
            수락
          </Button>
          <Button onPress={handleClose} variant="ghost" fullWidth>
            취소
          </Button>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
