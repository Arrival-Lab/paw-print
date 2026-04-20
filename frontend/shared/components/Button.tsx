import { ActivityIndicator, Pressable, Text, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: { bg: Colors.primary, text: Colors.text.inverse },
  secondary: { bg: Colors.secondary, text: Colors.text.inverse },
  outline: { bg: 'transparent', text: Colors.primary, border: Colors.primary },
  ghost: { bg: 'transparent', text: Colors.primary },
  danger: { bg: Colors.status.error, text: Colors.text.inverse },
};

const sizeStyles: Record<Size, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, fontSize: Typography.size.sm },
  md: { paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.lg, fontSize: Typography.size.md },
  lg: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, fontSize: Typography.size.lg },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onPress,
  children,
  fullWidth = false,
}: ButtonProps) {
  const vs = variantStyles[variant];
  const ss = sizeStyles[size];
  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle = {
    backgroundColor: vs.bg,
    paddingVertical: ss.paddingVertical,
    paddingHorizontal: ss.paddingHorizontal,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: vs.border ? 1 : 0,
    borderColor: vs.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    opacity: isDisabled ? 0.5 : 1,
    alignSelf: fullWidth ? 'stretch' : 'auto',
  };

  return (
    <Pressable
      style={({ pressed }) => [containerStyle, pressed && !isDisabled && { opacity: 0.75 }]}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vs.text} />
      ) : (
        <Text style={{ color: vs.text, fontSize: ss.fontSize, fontWeight: Typography.weight.semibold }}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}
