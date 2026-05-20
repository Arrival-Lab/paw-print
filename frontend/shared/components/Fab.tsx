import { useContext, useEffect, useRef } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { Elevation, Spacing, Typography } from '../../constants';
import { useTheme } from '../hooks/useTheme';
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
  const { isDark, colors } = useTheme();
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const hasLabel = !!label;
  const ref = useRef<View>(null);
  const setTarget = useTourStore((s) => s.setTarget);
  const clearTarget = useTourStore((s) => s.clearTarget);

  // glass tint — 색은 유지하되 BlurView 위라 알파 0.78~0.85 정도가 CTA 가독성 + 유리감 균형
  const tintColor =
    tone === 'primary'
      ? isDark
        ? 'rgba(244,168,184,0.55)'
        : 'rgba(244,168,184,0.82)'
      : isDark
        ? 'rgba(217,176,91,0.55)'
        : 'rgba(217,176,91,0.85)';

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

  const radius = Spacing.fab.size / 2;

  return (
    <View
      ref={ref as any}
      style={[
        {
          position: 'absolute',
          bottom: bottom ?? (tabBarHeight + Spacing.fab.bottom),
          right: right ?? Spacing.fab.right,
          borderRadius: radius,
        },
        Elevation.floating,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label ?? '추가'}
        style={{
          height: Spacing.fab.size,
          minWidth: Spacing.fab.size,
          paddingHorizontal: hasLabel ? Spacing.lg : 0,
          borderRadius: radius,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.glass.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: hasLabel ? Spacing.sm : 0,
        }}
      >
        <BlurView
          intensity={50}
          tint={isDark ? 'dark' : 'light'}
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tintColor }]} />
        {/* 원형 FAB 은 가로 1px highlight 라인이 곡선을 따라가지 못해 가로 줄로 보임 →
            shadow + blur + tint + border 만으로 충분히 유리 느낌 표현. */}
        <Feather name={icon} size={24} color="#fff" />
        {hasLabel ? <Text style={{ ...Typography.preset.button, color: '#fff' }}>{label}</Text> : null}
      </TouchableOpacity>
    </View>
  );
}
