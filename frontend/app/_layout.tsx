import '../global.css';
import '../shared/i18n'; // i18next 초기화 — 앱 첫 렌더 전에 동기 실행 (locale 리소스 인라인 번들)
import { useEffect, useState } from 'react';
import { Stack, Redirect } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../shared/api/queryClient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';
import { useAuthStore, hydrateAuthFromStorage } from '../features/auth/store/authStore';
import { useAuth } from '../features/auth/hooks/useAuth';
import { registerPushToken } from '../features/auth/utils/push';
import { useNotificationResponse } from '../features/care/hooks/useNotificationResponse';
import { useTheme } from '../shared/hooks/useTheme';
import { initAuthStorage } from '../shared/utils/storage';
import PremiumModal from '../features/subscription/components/PremiumModal';
import LoginPromptModal from '../shared/components/LoginPromptModal';
import GlossarySheet from '../features/glossary/components/GlossarySheet';
import AppUpdateGate from '../features/appUpdate/components/AppUpdateGate';

SplashScreen.preventAutoHideAsync();

// 앱 전체 기본 폰트 — Pretendard (variable). 화면에서 fontWeight 만 지정하면 자동 매핑.
const TextAny = RNText as any;
const InputAny = RNTextInput as any;
TextAny.defaultProps = TextAny.defaultProps ?? {};
InputAny.defaultProps = InputAny.defaultProps ?? {};
TextAny.defaultProps.style = [{ fontFamily: 'Pretendard' }, TextAny.defaultProps.style];
InputAny.defaultProps.style = [{ fontFamily: 'Pretendard' }, InputAny.defaultProps.style];

function AppContent() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.isGuest);
  const user = useAuthStore((s) => s.user);
  const { refreshUser } = useAuth();
  const { isDark, colors } = useTheme();
  const [fontsLoaded] = useFonts({
    Pretendard: require('../assets/fonts/PretendardVariable.ttf'),
  });
  // SecureStore 캐시 워밍 + (필요 시) MMKV→SecureStore 토큰 마이그레이션 완료 여부.
  // false 동안엔 axios 가 토큰 없이 호출하지 않도록 렌더 보류.
  const [storageReady, setStorageReady] = useState(false);
  useNotificationResponse();

  useEffect(() => {
    let cancelled = false;
    initAuthStorage().then(() => {
      if (cancelled) return;
      hydrateAuthFromStorage();
      setStorageReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (fontsLoaded && storageReady) {
      SplashScreen.hideAsync();
    }
    if (isAuthenticated) {
      refreshUser();
      registerPushToken();
    }
  }, [isAuthenticated, fontsLoaded, storageReady]);

  if (!fontsLoaded || !storageReady) return null;

  // 인증·게스트 둘 다 (tabs) 진입 허용. 닉네임은 가입 시 자동 부여되므로 강제 onboarding 가드 없음 —
  // 사용자가 원하면 마이페이지의 닉네임 카드에서 수정.
  const allowTabs = isAuthenticated || isGuest;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      {!allowTabs ? <Redirect href="/(auth)/login" /> : null}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      <PremiumModal />
      <LoginPromptModal />
      <GlossarySheet />
      <AppUpdateGate />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
