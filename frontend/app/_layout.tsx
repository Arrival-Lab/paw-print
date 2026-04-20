import '../global.css';
import { useEffect } from 'react';
import { Stack, Redirect } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../features/auth/store/authStore';
import PremiumModal from '../shared/components/PremiumModal';
import client from '../shared/api/client';
import type { User } from '../features/auth/store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      retryDelay: 1000,
    },
  },
});

export default function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    if (isAuthenticated && !user) {
      client
        .get<User>('/api/auth/me')
        .then((data) => updateUser(data as unknown as Partial<User>))
        .catch(() => clearAuth());
    }
  }, [isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        {!isAuthenticated && <Redirect href="/(auth)/login" />}
        <Stack screenOptions={{ headerShown: false }} />
        <PremiumModal />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
