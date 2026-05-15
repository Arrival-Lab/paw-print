import { Pressable, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../hooks/useTheme';

interface ActionItem {
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  label?: string;
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean | (() => void);
  actions?: ActionItem[];
  variant?: 'default' | 'large' | 'transparent';
  style?: ViewStyle;
}

export default function ScreenHeader({
  title,
  subtitle,
  back = false,
  actions,
  variant = 'default',
  style,
}: ScreenHeaderProps) {
  const Colors = useColors();
  const handleBack = () => {
    if (typeof back === 'function') {
      back();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    }
  };

  const isLarge = variant === 'large';
  const bg = variant === 'transparent' ? 'transparent' : Colors.white;

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.sm,
          paddingBottom: isLarge ? Spacing.md : Spacing.sm,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44 }}>
        {back ? (
          <Pressable
            onPress={handleBack}
            hitSlop={Spacing.hitSlop}
            style={{
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: Spacing.xs,
              marginLeft: -Spacing.sm,
            }}
          >
            <Feather name="chevron-left" size={26} color={Colors.text.primary} />
          </Pressable>
        ) : null}

        {!isLarge && (
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ ...Typography.preset.title, color: Colors.text.primary }}>
              {title}
            </Text>
            {subtitle ? (
              <Text
                numberOfLines={1}
                style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        )}

        {isLarge && <View style={{ flex: 1 }} />}

        {actions?.length ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            {actions.map((a, i) => (
              <Pressable
                key={`${a.icon}-${i}`}
                onPress={a.onPress}
                hitSlop={Spacing.hitSlop}
                accessibilityLabel={a.label}
                style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
              >
                <Feather name={a.icon} size={20} color={Colors.text.primary} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {isLarge ? (
        <View style={{ marginTop: Spacing.md }}>
          <Text style={{ ...Typography.preset.h1, color: Colors.text.primary }}>{title}</Text>
          {subtitle ? (
            <Text style={{ marginTop: 4, ...Typography.preset.body, color: Colors.text.secondary }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
