import { useContext, useEffect, useRef } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { Elevation, Spacing, Typography } from '../../constants';
import { useColors } from '../hooks/useTheme';
import { useTourStore, TOUR_TARGETS } from '../../features/onboarding/tourStore';

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
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const bg = tone === 'primary' ? Colors.primary : Colors.secondaryDark;
  const hasLabel = !!label;
  const ref = useRef<View>(null);
  const setTarget = useTourStore((s) => s.setTarget);
  const clearTarget = useTourStore((s) => s.clearTarget);

  useEffect(() => {
    const measure = () => {
      (ref.current as any)?.measureInWindow?.((x: number, y: number, w: number, h: number) => {
        if (w > 0 && h > 0) setTarget(TOUR_TARGETS.FAB, { x, y, width: w, height: h });
      });
    };
    const t1 = setTimeout(measure, 100);
    const t2 = setTimeout(measure, 500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTarget(TOUR_TARGETS.FAB); };
  }, []);

  return (
    <TouchableOpacity
      ref={ref as any}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label ?? '추가'}
      style={[
        {
          position: 'absolute',
          bottom: bottom ?? (tabBarHeight + Spacing.fab.bottom),
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
