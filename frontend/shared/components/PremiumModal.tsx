import { Modal, View, Text } from 'react-native';
import { useUiStore } from '../store/uiStore';
import { Config, Colors, Spacing, Typography } from '../../constants';
import Button from './Button';

export default function PremiumModal() {
  const { isPremiumModalVisible, premiumModalMessage, hidePremiumModal } = useUiStore();

  return (
    <Modal
      visible={isPremiumModalVisible}
      transparent
      animationType="fade"
      onRequestClose={hidePremiumModal}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.overlay,
          alignItems: 'center',
          justifyContent: 'center',
          padding: Spacing.xl,
        }}
      >
        <View
          style={{
            backgroundColor: Colors.white,
            borderRadius: Spacing.borderRadius.xl,
            padding: Spacing.xxl,
            width: '100%',
            maxWidth: 360,
          }}
        >
          <Text
            style={{
              fontSize: Typography.size.xl,
              fontWeight: Typography.weight.bold,
              color: Colors.text.primary,
              textAlign: 'center',
              marginBottom: Spacing.md,
            }}
          >
            프리미엄 기능이에요 🌟
          </Text>

          <Text
            style={{
              fontSize: Typography.size.md,
              color: Colors.text.secondary,
              textAlign: 'center',
              lineHeight: Typography.size.md * Typography.lineHeight.normal,
              marginBottom: Spacing.lg,
            }}
          >
            {premiumModalMessage}
          </Text>

          <Text
            style={{
              fontSize: Typography.size.sm,
              color: Colors.text.tertiary,
              textAlign: 'center',
              marginBottom: Spacing.xl,
            }}
          >
            월 {Config.premiumPriceMonthly.toLocaleString()}원/월
          </Text>

          <Button variant="primary" fullWidth onPress={hidePremiumModal}>
            프리미엄 시작하기
          </Button>
          <View style={{ height: Spacing.sm }} />
          <Button variant="ghost" fullWidth onPress={hidePremiumModal}>
            닫기
          </Button>
        </View>
      </View>
    </Modal>
  );
}
