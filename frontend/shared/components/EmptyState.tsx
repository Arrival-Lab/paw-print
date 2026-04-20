import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../constants';
import Button from './Button';

interface EmptyStateProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl }}>
      <Feather name={icon} size={48} color={Colors.text.tertiary} />
      <Text
        style={{
          marginTop: Spacing.lg,
          fontSize: Typography.size.lg,
          fontWeight: Typography.weight.semibold,
          color: Colors.text.primary,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={{
            marginTop: Spacing.sm,
            fontSize: Typography.size.md,
            color: Colors.text.secondary,
            textAlign: 'center',
            lineHeight: Typography.size.md * Typography.lineHeight.normal,
          }}
        >
          {description}
        </Text>
      )}
      {action && (
        <View style={{ marginTop: Spacing.xl }}>
          <Button onPress={action.onPress}>{action.label}</Button>
        </View>
      )}
    </View>
  );
}
