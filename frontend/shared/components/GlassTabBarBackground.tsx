import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../hooks/useTheme';

export default function GlassTabBarBackground() {
  const { isDark, colors } = useTheme();
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView
        intensity={50}
        tint={isDark ? 'dark' : 'light'}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass.surface }]} />
      {/* Specular edge — 탭바 윗면의 1px highlight 로 떠 있는 느낌 */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 1,
          left: 0,
          right: 0,
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.glass.borderSoft,
        }}
      />
    </View>
  );
}
