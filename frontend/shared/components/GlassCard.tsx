import { BlurView } from 'expo-blur';
import { Platform, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Spacing } from '../../constants';
import { useTheme } from '../hooks/useTheme';

type Tone = 'surface' | 'surfaceStrong' | 'primaryTint';
type Padding = 'none' | 'sm' | 'md' | 'lg';

interface GlassCardProps {
  children: React.ReactNode;
  tone?: Tone;
  intensity?: number;
  padding?: Padding;
  borderRadius?: number;
  border?: boolean;
  /** false 면 BlurView 생략 — 단색 surface 위 작은 칩에 사용 (perf↑). 기본 true. */
  blur?: boolean;
  /** false 면 specular highlight + floating shadow 생략 (예: 풀폭 헤더). 기본 true. */
  highlight?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
  activeOpacity?: number;
}

const paddingMap: Record<Padding, number> = {
  none: 0,
  sm: Spacing.md,
  md: Spacing.lg,
  lg: Spacing.xl,
};

export default function GlassCard({
  children,
  tone = 'surface',
  intensity = 50,
  padding = 'md',
  borderRadius = Spacing.borderRadius.lg,
  border = true,
  blur = true,
  highlight = true,
  style,
  onPress,
  activeOpacity = 0.9,
}: GlassCardProps) {
  const { isDark, colors } = useTheme();
  const tintColor = colors.glass[tone];

  // 떠있는 유리판 — 부드러운 큰 그림자
  const floatingShadow: ViewStyle = highlight
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.35 : 0.12,
        shadowRadius: 16,
        elevation: 6,
      }
    : {};

  const outer: ViewStyle = {
    borderRadius,
    overflow: 'hidden',
    ...(border ? { borderWidth: 1, borderColor: colors.glass.border } : null),
  };

  const Wrapper: any = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, activeOpacity } : {};

  if (!blur) {
    return (
      <Wrapper
        {...wrapperProps}
        style={[floatingShadow, { borderRadius }, style]}
      >
        <View style={[outer, { backgroundColor: tintColor, padding: paddingMap[padding] }]}>
          {children}
        </View>
      </Wrapper>
    );
  }

  return (
    <Wrapper {...wrapperProps} style={[floatingShadow, { borderRadius }, style]}>
      <View style={outer}>
        <BlurView
          intensity={intensity}
          tint={isDark ? 'dark' : 'light'}
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        >
          <View style={{ backgroundColor: tintColor, padding: paddingMap[padding] }}>
            {/* 상단 1px specular edge — 진짜 유리 윗면 하이라이트.
                ※ 위 50% 옅은 오버레이는 hard cutoff 가로 라인으로 보여서 제거.
                gradient 없이 simulate 하면 어쩔 수 없이 줄이 보이므로 1px edge 만 유지. */}
            {highlight ? (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  height: 1,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.7)',
                }}
              />
            ) : null}
            {children}
          </View>
        </BlurView>
      </View>
    </Wrapper>
  );
}
