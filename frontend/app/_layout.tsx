import '../global.css';
import { useEffect } from 'react';
import { Stack, Redirect } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../features/auth/store/authStore';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useTheme } from '../shared/hooks/useTheme';
import { useOnboardingStore } from '../shared/store/onboardingStore';
import PremiumModal from '../shared/components/PremiumModal';

SplashScreen.preventAutoHideAsync();

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

  useEffect(() => {
    SplashScreen.hideAsync();
    if (isAuthenticated) {
      refreshUser();
    }
  }, [isAuthenticated]);

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
