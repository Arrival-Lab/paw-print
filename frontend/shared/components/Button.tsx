import { ActivityIndicator, TouchableOpacity, Text, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Elevation, Spacing, Typography } from '../../constants';
import { useColors } from '../hooks/useTheme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'tonal';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  fullWidth?: boolean;
  icon?: React.ComponentProps<typeof Feather>['name'];
  iconPosition?: 'left' | 'right';
  elevated?: boolean;
}

const sizeStyles: Record<
  Size,
  { paddingVertical: number; paddingHorizontal: number; fontSize: number; iconSize: number; minHeight: number }
> = {
  sm: { paddingVertical: 6, paddingHorizontal: Spacing.md, fontSize: Typography.size.sm, iconSize: 14, minHeight: 32 },
  md: { paddingVertical: 10, paddingHorizontal: Spacing.lg, fontSize: Typography.size.md, iconSize: 16, minHeight: 44 },
  lg: { paddingVertical: 14, paddingHorizontal: Spacing.xl, fontSize: Typography.size.lg, iconSize: 18, minHeight: 52 },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onPress,
  children,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  elevated = false,
}: ButtonProps) {
  const Colors = useColors();
  const ss = sizeStyles[size];
  const isDisabled = disabled || loading;

  const variantStyles: Record<Variant, { bg: string; text: string; border?: string; pressedBg?: string }> = {
    primary: { bg: Colors.primary, text: Colors.text.inverse, pressedBg: Colors.primaryDark },
    secondary: { bg: Colors.secondary, text: Colors.primaryDark, pressedBg: Colors.secondaryDark },
    tonal: { bg: Colors.primaryLight, text: Colors.primaryDark, pressedBg: Colors.primaryMuted },
    outline: { bg: 'transparent', text: Colors.primary, border: Colors.primary, pressedBg: Colors.primaryLight },
    ghost: { bg: 'transparent', text: Colors.primary, pressedBg: Colors.primaryLight },
    danger: { bg: Colors.status.error, text: Colors.text.inverse, pressedBg: '#B83838' },
  };
  const vs = variantStyles[variant];

  const base: ViewStyle = {
    backgroundColor: vs.bg,
    paddingVertical: ss.paddingVertical,
    paddingHorizontal: ss.paddingHorizontal,
    minHeight: ss.minHeight,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: vs.border ? 1.5 : 0,
    borderColor: vs.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    opacity: isDisabled ? 0.4 : 1,
    alignSelf: fullWidth ? 'stretch' : 'auto',
  };

  return (
    <TouchableOpacity
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={elevated && !isDisabled ? [base, Elevation.raised] : base}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vs.text} />
      ) : (
        <>
          {icon && iconPosition === 'left' && <Feather name={icon} size={ss.iconSize} color={vs.text} />}
          <Text
            style={{
              color: vs.text,
              fontSize: ss.fontSize,
              fontWeight: Typography.weight.semibold,
              letterSpacing: Typography.letterSpacing.normal,
            }}
          >
            {children}
          </Text>
          {icon && iconPosition === 'right' && <Feather name={icon} size={ss.iconSize} color={vs.text} />}
        </>
      )}
    </TouchableOpacity>
  );
}
