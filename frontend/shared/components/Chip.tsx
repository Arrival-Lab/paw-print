import { Pressable, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../hooks/useTheme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Feather>['name'];
  disabled?: boolean;
}

export default function Chip({ label, selected = false, onPress, icon, disabled = false }: ChipProps) {
  const Colors = useColors();
  const bg = selected ? Colors.primary : Colors.primaryLight;
  const fg = selected ? Colors.white : Colors.primaryDark;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: bg,
        paddingVertical: 6,
        paddingHorizontal: Spacing.md,
        borderRadius: Spacing.borderRadius.full,
        opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
      })}
    >
      {icon ? <Feather name={icon} size={14} color={fg} /> : null}
      <Text
        style={{
          color: fg,
          fontSize: Typography.size.sm,
          fontWeight: Typography.weight.semibold,
          letterSpacing: Typography.letterSpacing.normal,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
