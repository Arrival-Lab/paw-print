import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../hooks/useTheme';

interface SectionHeaderProps {
  title: string;
  caption?: string;
  action?: { label: string; onPress: () => void };
  icon?: React.ComponentProps<typeof Feather>['name'];
}

export default function SectionHeader({ title, caption, action, icon }: SectionHeaderProps) {
  const Colors = useColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.md,
      }}
    >
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
        {icon ? <Feather name={icon} size={18} color={Colors.primary} /> : null}
        <View style={{ flex: 1 }}>
          <Text style={{ ...Typography.preset.h3, color: Colors.text.primary }}>{title}</Text>
          {caption ? (
            <Text style={{ marginTop: 2, ...Typography.preset.bodySmall, color: Colors.text.secondary }}>
              {caption}
            </Text>
          ) : null}
        </View>
      </View>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={Spacing.hitSlop}>
          <Text style={{ ...Typography.preset.label, color: Colors.primary }}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
