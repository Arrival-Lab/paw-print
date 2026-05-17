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
        justifyContent: 'flex-start',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xxxxl * 2,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: Spacing.lg,
        }}
      >
        <Feather name={icon} size={28} color={iconColor} />
      </View>

      <Text
        style={{
          ...Typography.preset.heading,
          fontWeight: Typography.weight.bold,
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
            ...Typography.preset.bodySmall,
            color: Colors.text.secondary,
            textAlign: 'center',
            // 한국어 자연 줄바꿈을 위해 maxWidth 완화 — 화면 폭의 자연한 여백만 사용.
            paddingHorizontal: Spacing.lg,
          }}
        >
          {description}
        </Text>
      )}

      {action && (
        // 1차/2차 액션을 비슷한 위계의 칩으로. 빈 화면이라 톤 자체는 부드럽게.
        <View
          style={{
            marginTop: Spacing.xl,
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Button onPress={action.onPress} variant="tonal" size="md">
            {action.label}
          </Button>
          {secondaryAction && (
            <Button onPress={secondaryAction.onPress} variant="ghost" size="md">
              {secondaryAction.label}
            </Button>
          )}
        </View>
      )}
    </View>
  );
}
