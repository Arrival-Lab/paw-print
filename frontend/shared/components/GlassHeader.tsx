import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import ScreenHeader, { ScreenHeaderProps } from './ScreenHeader';
import { useTheme } from '../hooks/useTheme';

interface GlassHeaderProps extends Omit<ScreenHeaderProps, 'variant'> {
  /** 측정된 헤더 전체 높이(safeArea + bottomSlot 포함) — ScrollView paddingTop 에 사용. */
  onHeightChange?: (height: number) => void;
  intensity?: number;
  /** ScreenHeader 의 컨텍스트 영역 (PetSelector 등) — paddingHorizontal: Spacing.lg 자동 적용. */
  // children 은 ScreenHeaderProps 에서 그대로 forward.
  /** ScreenHeader 와 별개로, 같은 BlurView 안에 추가 row (검색바, 필터 칩, 서브탭 등). 자체 padding 필요. */
  bottomSlot?: React.ReactNode;
}

export default function GlassHeader({
  onHeightChange,
  intensity = 50,
  bottomSlot,
  ...screenProps
}: GlassHeaderProps) {
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      onLayout={(e) => onHeightChange?.(e.nativeEvent.layout.height)}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}
      pointerEvents="box-none"
    >
      <BlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
      >
        <View style={{ paddingTop: insets.top, backgroundColor: colors.glass.surface }}>
          {/* Specular highlight — 상단 1px edge + 위쪽 옅은 화이트 */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: insets.top,
              height: 1,
              backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.55)',
            }}
          />
          <ScreenHeader {...screenProps} variant="transparent" />
          {bottomSlot}
        </View>
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.glass.borderSoft }} />
      </BlurView>
    </View>
  );
}
