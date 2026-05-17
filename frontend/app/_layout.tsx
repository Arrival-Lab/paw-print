import '../global.css';
import { useEffect } from 'react';
import { Stack, Redirect } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';
import { useAuthStore } from '../features/auth/store/authStore';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useTheme } from '../shared/hooks/useTheme';
import { useOnboardingStore } from '../shared/store/onboardingStore';
import PremiumModal from '../shared/components/PremiumModal';
import AppTourOverlay from '../features/onboarding/components/AppTourOverlay';

SplashScreen.preventAutoHideAsync();

// 앱 전체 기본 폰트 — Pretendard (variable). 화면에서 fontWeight 만 지정하면 자동 매핑.
const TextAny = RNText as any;
const InputAny = RNTextInput as any;
TextAny.defaultProps = TextAny.defaultProps ?? {};
InputAny.defaultProps = InputAny.defaultProps ?? {};
TextAny.defaultProps.style = [{ fontFamily: 'Pretendard' }, TextAny.defaultProps.style];
InputAny.defaultProps.style = [{ fontFamily: 'Pretendard' }, InputAny.defaultProps.style];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      retryDelay: 1000,
    },
  },
});

function AppContent() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const onboardingCompleted = useOnboardingStore((s) => s.completed);
  const { refreshUser } = useAuth();
  const { isDark, colors } = useTheme();
  const [fontsLoaded] = useFonts({
    Pretendard: require('../assets/fonts/PretendardVariable.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
    if (isAuthenticated) {
      refreshUser();
    }
  }, [isAuthenticated, fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      {!isAuthenticated ? (
        <Redirect href="/(auth)/login" />
      ) : !onboardingCompleted ? (
        <Redirect href="/onboarding" />
      ) : null}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      <PremiumModal />
      {isAuthenticated && onboardingCompleted ? <AppTourOverlay /> : null}
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
