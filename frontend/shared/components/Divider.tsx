import { View, ViewStyle } from 'react-native';
import { Spacing } from '../../constants';
import { useColors } from '../hooks/useTheme';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  inset?: number;
  tone?: 'default' | 'strong';
  style?: ViewStyle;
}

export default function Divider({
  orientation = 'horizontal',
  inset = 0,
  tone = 'default',
  style,
}: DividerProps) {
  const Colors = useColors();
  const color = tone === 'strong' ? Colors.borderStrong : Colors.border;

  if (orientation === 'vertical') {
    return (
      <View
        style={[
          { width: 1, alignSelf: 'stretch', backgroundColor: color, marginHorizontal: inset || Spacing.sm },
          style,
        ]}
      />
    );
  }

  return <View style={[{ height: 1, backgroundColor: color, marginHorizontal: inset }, style]} />;
}
