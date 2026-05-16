import { TouchableOpacity, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Elevation, Spacing, Typography } from '../../constants';
import { useColors } from '../hooks/useTheme';

interface FabProps {
  onPress: () => void;
  icon?: React.ComponentProps<typeof Feather>['name'];
  label?: string;
  tone?: 'primary' | 'secondary';
  bottom?: number;
  right?: number;
  accessibilityLabel?: string;
}

export default function Fab({
  onPress,
  icon = 'plus',
  label,
  tone = 'primary',
  bottom,
  right,
  accessibilityLabel,
}: FabProps) {
  const Colors = useColors();
  const bg = tone === 'primary' ? Colors.primary : Colors.secondaryDark;
  const hasLabel = !!label;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label ?? '추가'}
      style={[
        {
          position: 'absolute',
          bottom: bottom ?? Spacing.fab.bottom,
          right: right ?? Spacing.fab.right,
          height: Spacing.fab.size,
          minWidth: Spacing.fab.size,
          paddingHorizontal: hasLabel ? Spacing.lg : 0,
          borderRadius: Spacing.fab.size / 2,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: hasLabel ? Spacing.sm : 0,
        },
        Elevation.floating,
      ]}
    >
      <Feather name={icon} size={24} color={Colors.white} />
      {hasLabel ? <Text style={{ ...Typography.preset.button, color: Colors.white }}>{label}</Text> : null}
    </TouchableOpacity>
  );
}
