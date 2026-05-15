import { ActivityIndicator, Text, View } from 'react-native';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../hooks/useTheme';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'small' | 'large';
  inline?: boolean;
}

export default function LoadingSpinner({ label, size = 'large', inline = false }: LoadingSpinnerProps) {
  const Colors = useColors();

  if (inline) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
          paddingVertical: Spacing.md,
        }}
      >
        <ActivityIndicator size="small" color={Colors.primary} />
        {label && (
          <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary }}>{label}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md }}>
      <ActivityIndicator size={size} color={Colors.primary} />
      {label && (
        <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary }}>{label}</Text>
      )}
    </View>
  );
}
