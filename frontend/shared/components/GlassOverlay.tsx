import { Platform, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../hooks/useTheme';

interface GlassOverlayProps {
  onPress?: () => void;
  intensity?: number;
  children?: React.ReactNode;
  style?: any;
}

/** 모달/시트 backdrop — 풀스크린 BlurView + 살짝 어두운 tint. 탭하면 onPress. */
export default function GlassOverlay({ onPress, intensity = 60, children, style }: GlassOverlayProps) {
  const { isDark, colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[{ flex: 1 }, style]}>
      <BlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass.overlay }]}
      />
      {children}
    </Pressable>
  );
}
