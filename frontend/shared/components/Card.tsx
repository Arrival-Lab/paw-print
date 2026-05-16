import { TouchableOpacity, View, ViewStyle } from 'react-native';
import { Elevation, Spacing } from '../../constants';
import { useColors } from '../hooks/useTheme';

type Variant = 'flat' | 'outlined' | 'elevated' | 'tinted';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: Variant;
  padding?: keyof typeof paddingMap;
}

const paddingMap = {
  none: 0,
  sm: Spacing.md,
  md: Spacing.lg,
  lg: Spacing.xl,
} as const;

export default function Card({
  children,
  onPress,
  style,
  variant = 'outlined',
  padding = 'md',
}: CardProps) {
  const Colors = useColors();

  const variantStyle: Record<Variant, ViewStyle> = {
    flat: { backgroundColor: Colors.white },
    outlined: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
    elevated: { backgroundColor: Colors.white, ...Elevation.card },
    tinted: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  };

  const base: ViewStyle = {
    borderRadius: Spacing.borderRadius.lg,
    padding: paddingMap[padding],
    ...variantStyle[variant],
  };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[base, style]}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[base, style]}>{children}</View>;
}
