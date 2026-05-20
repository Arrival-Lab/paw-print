import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../hooks/useTheme';

interface GlassStickyBarProps {
  children: React.ReactNode;
  /** 헤더 바로 아래에 absolute 로 띄울 때 헤더 height. ScrollView paddingTop = top + 자신의 height. */
  top: number;
  onHeightChange?: (height: number) => void;
  intensity?: number;
  bottomBorder?: boolean;
  style?: ViewStyle;
}

export default function GlassStickyBar({
  children,
  top,
  onHeightChange,
  intensity = 50,
  bottomBorder = true,
  style,
}: GlassStickyBarProps) {
  const { isDark, colors } = useTheme();

  return (
    <View
      onLayout={(e) => onHeightChange?.(e.nativeEvent.layout.height)}
      style={[{ position: 'absolute', top, left: 0, right: 0, zIndex: 9 }, style]}
      pointerEvents="box-none"
    >
      <BlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
      >
        <View style={{ backgroundColor: colors.glass.surface }}>
          {/* Specular edge — 상단 1px highlight */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: 1,
              backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)',
            }}
          />
          {children}
        </View>
        {bottomBorder ? (
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.glass.borderSoft }} />
        ) : null}
      </BlurView>
    </View>
  );
}
