import { Text, View, ViewStyle } from 'react-native';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../hooks/useTheme';

type Tone = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral' | 'premium';
type Size = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  tone?: Tone;
  size?: Size;
  style?: ViewStyle;
}

const sizeStyle: Record<Size, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { paddingVertical: 2, paddingHorizontal: Spacing.sm, fontSize: Typography.size.xs },
  md: { paddingVertical: 4, paddingHorizontal: Spacing.md, fontSize: Typography.size.sm },
};

export default function Badge({ children, tone = 'primary', size = 'sm', style }: BadgeProps) {
  const Colors = useColors();

  const toneStyle: Record<Tone, { bg: string; text: string }> = {
    primary: { bg: Colors.primaryLight, text: Colors.primaryDark },
    secondary: { bg: Colors.secondaryLight, text: Colors.secondaryDark },
    success: { bg: Colors.status.successBg, text: Colors.status.success },
    warning: { bg: Colors.status.warningBg, text: Colors.status.warning },
    error: { bg: Colors.status.errorBg, text: Colors.status.error },
    neutral: { bg: Colors.surface, text: Colors.text.secondary },
    premium: { bg: Colors.premiumBg, text: Colors.premiumText },
  };

  const ts = toneStyle[tone];
  const ss = sizeStyle[size];

  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          backgroundColor: ts.bg,
          paddingVertical: ss.paddingVertical,
          paddingHorizontal: ss.paddingHorizontal,
          borderRadius: Spacing.borderRadius.full,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: ts.text,
          fontSize: ss.fontSize,
          fontWeight: Typography.weight.semibold,
          letterSpacing: Typography.letterSpacing.wide,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
