import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../hooks/useTheme';
import Button from './Button';

interface EmptyStateProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
  secondaryAction?: { label: string; onPress: () => void };
  tone?: 'default' | 'muted';
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  tone = 'default',
}: EmptyStateProps) {
  const Colors = useColors();
  const iconBg = tone === 'muted' ? Colors.surface : Colors.primaryLight;
  const iconColor = tone === 'muted' ? Colors.text.tertiary : Colors.primary;

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xxxl,
        paddingVertical: Spacing.xxxxl,
      }}
    >
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: Spacing.xl,
        }}
      >
        <Feather name={icon} size={36} color={iconColor} />
      </View>

      <Text style={{ ...Typography.preset.h3, color: Colors.text.primary, textAlign: 'center' }}>
        {title}
      </Text>

      {description && (
        <Text
          style={{
            marginTop: Spacing.sm,
            ...Typography.preset.body,
            color: Colors.text.secondary,
            textAlign: 'center',
            maxWidth: 280,
          }}
        >
          {description}
        </Text>
      )}

      {action && (
        <View style={{ marginTop: Spacing.xl, alignSelf: 'stretch', maxWidth: 280, alignItems: 'center' }}>
          <Button onPress={action.onPress} fullWidth>
            {action.label}
          </Button>
        </View>
      )}

      {secondaryAction && (
        <View style={{ marginTop: Spacing.sm }}>
          <Button onPress={secondaryAction.onPress} variant="ghost" size="sm">
            {secondaryAction.label}
          </Button>
        </View>
      )}
    </View>
  );
}
