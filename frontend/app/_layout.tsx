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
import { registerPushToken } from '../shared/utils/push';
import { useNotificationResponse } from '../shared/hooks/useNotificationResponse';
import { useTheme } from '../shared/hooks/useTheme';
import PremiumModal from '../shared/components/PremiumModal';
import LoginPromptModal from '../shared/components/LoginPromptModal';
import AppTourOverlay from '../features/onboarding/components/AppTourOverlay';
import GlossarySheet from '../features/glossary/components/GlossarySheet';

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
  const isGuest = useAuthStore((s) => s.isGuest);
  const user = useAuthStore((s) => s.user);
  const { refreshUser } = useAuth();
  const { isDark, colors } = useTheme();
  const [fontsLoaded] = useFonts({
    Pretendard: require('../assets/fonts/PretendardVariable.ttf'),
  });
  useNotificationResponse();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
    if (isAuthenticated) {
      refreshUser();
      registerPushToken();
    }
  }, [isAuthenticated, fontsLoaded]);

  if (!fontsLoaded) return null;

  // 인증·게스트 둘 다 (tabs) 진입 허용. 인증된 사용자만 닉네임 온보딩 가드 적용.
  const allowTabs = isAuthenticated || isGuest;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      {!allowTabs
        ? <Redirect href="/(auth)/login" />
        : isAuthenticated && user && !user.nickname
          ? <Redirect href="/onboarding/nickname" />
          : null}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      <PremiumModal />
      <LoginPromptModal />
      <GlossarySheet />
      {allowTabs ? <AppTourOverlay /> : null}
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
