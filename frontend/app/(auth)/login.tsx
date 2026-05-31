import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Colors as BrandColors, Config, Spacing, Typography, Elevation } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import { authApi } from '../../features/auth/api/authApi';
import { useAuthStore } from '../../features/auth/store/authStore';
import { setAccessToken, setRefreshToken } from '../../shared/utils/storage';

WebBrowser.maybeCompleteAuthSession();

type LoadingKind = 'google' | 'apple' | 'dev-premium' | 'dev-free' | null;

export default function LoginScreen() {
  const Colors = useColors();
  const [loading, setLoading] = useState<LoadingKind>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setGuest = useAuthStore((s) => s.setGuest);
  const exitGuest = useAuthStore((s) => s.exitGuest);
  const queryClient = useQueryClient();
  // setLoading 만으로는 race 차단 불충분 — 폴더블 폼팩터 전환 / 2FA 재진입 등으로 핸들러가
  // 두 번 trigger 되면 backend OAuth callback 도 두 번 → issueTokens 도 두 번 호출되며
  // 첫 토큰이 즉시 invalidate 되는 정황 (Fold7 사용자 케이스). ref 로 1회만 진행 보장.
  const inFlightRef = useRef(false);

  // 로그인 화면에 도달했다 = 사용자는 더 이상 게스트 활성 상태가 아니어야 함.
  // 이전 세션 잔존 게스트 플래그를 정리해 (tabs) 하위 overlay 가 로그인 위에 뜨지 않도록.
  useEffect(() => {
    if (useAuthStore.getState().isGuest) exitGuest();
  }, [exitGuest]);

  const handleGuestEntry = () => {
    setGuest();
    router.replace('/(tabs)');
  };

  const handleGoogleLogin = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading('google');
    try {
      const authUrl = `${Config.apiBaseUrl}/oauth2/authorization/google`;
      const redirectUri = 'pawprint://auth';
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      if (result.type !== 'success') {
        setLoading(null);
        return;
      }
      const params = new URLSearchParams(result.url.split('?')[1] ?? '');
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (!accessToken || !refreshToken) throw new Error('토큰이 없습니다.');
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      const user = await authApi.me();
      setAuth(user as any, accessToken, refreshToken);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('오류', '로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(null);
      inFlightRef.current = false;
    }
  };

  const handleAppleLogin = async () => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'macos') return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading('apple');
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const { identityToken } = credential;
      if (!identityToken) throw new Error('No identity token');
      const data = (await authApi.appleLogin(identityToken)) as any;
      authApi.saveTokens(data.accessToken, data.refreshToken);
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.replace('/(tabs)');
    } catch (e: any) {
      // ERR_REQUEST_CANCELED: 사용자가 취소한 경우 — 알림 없이 무시
      if (e?.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('오류', '로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(null);
      inFlightRef.current = false;
    }
  };

  const handleDev = async (kind: 'dev-premium' | 'dev-free') => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(kind);
    try {
      const data = (await (kind === 'dev-premium' ? authApi.devLogin() : authApi.devLoginFree())) as any;
      authApi.saveTokens(data.accessToken, data.refreshToken);
      queryClient.clear();
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('오류', 'Dev 로그인 실패 (백엔드 로컬 실행 중인지 확인)');
    } finally {
      setLoading(null);
      inFlightRef.current = false;
    }
  };

  const isLoading = loading !== null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: Spacing.xxl,
          paddingTop: Spacing.xxxxl,
          paddingBottom: Spacing.xxl,
          justifyContent: 'space-between',
        }}
      >
        {/* Hero */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: Colors.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
              ...Elevation.card,
            }}
          >
            <Image
              source={require('../../assets/icon.png')}
              style={{ width: 64, height: 64, borderRadius: 16 }}
              resizeMode="contain"
            />
          </View>
          <View style={{ alignItems: 'center', gap: Spacing.sm }}>
            <Text
              style={{
                ...Typography.preset.display,
                color: Colors.primary,
              }}
            >
              발자국
            </Text>
            <Text
              style={{
                ...Typography.preset.body,
                color: Colors.text.secondary,
                textAlign: 'center',
              }}
            >
              반려동물의 건강 기록을{'\n'}한 곳에서 안전하게
            </Text>
          </View>
        </View>

        {/* Login buttons */}
        <View style={{ gap: Spacing.md }}>
          {__DEV__ && (
            <View style={{ gap: Spacing.sm, marginBottom: Spacing.md }}>
              <DevButton
                label="Dev Login · Premium"
                tone="primary"
                loading={loading === 'dev-premium'}
                disabled={isLoading}
                onPress={() => handleDev('dev-premium')}
              />
              <DevButton
                label="Dev Login · Free"
                tone="neutral"
                loading={loading === 'dev-free'}
                disabled={isLoading}
                onPress={() => handleDev('dev-free')}
              />
            </View>
          )}

          <SocialButton
            provider="google"
            loading={loading === 'google'}
            disabled={isLoading}
            onPress={handleGoogleLogin}
          />

          {(Platform.OS === 'ios' || Platform.OS === 'macos') && (
            <SocialButton
              provider="apple"
              loading={loading === 'apple'}
              disabled={isLoading}
              onPress={handleAppleLogin}
            />
          )}

          {/* 게스트 진입 — App Store 5.1.1(v) 대응. 비-계정 기능(병원·날씨/케어팁·공지·약관 등) 둘러보기. */}
          <TouchableOpacity
            onPress={handleGuestEntry}
            disabled={isLoading}
            activeOpacity={0.7}
            style={{
              alignItems: 'center',
              paddingVertical: Spacing.md,
              marginTop: Spacing.xs,
            }}
          >
            <Text
              style={{
                ...Typography.preset.bodySmall,
                color: Colors.text.secondary,
                textDecorationLine: 'underline',
              }}
            >
              로그인 없이 둘러보기
            </Text>
          </TouchableOpacity>

          <Text
            style={{
              ...Typography.preset.caption,
              color: Colors.text.tertiary,
              textAlign: 'center',
              marginTop: Spacing.md,
              lineHeight: Typography.size.xs * Typography.lineHeight.relaxed,
            }}
          >
            로그인하면{' '}
            <Text
              style={{ color: Colors.text.accent, textDecorationLine: 'underline' }}
              onPress={() => Linking.openURL('https://pawprintapp.link/support/terms')}
            >
              서비스 이용약관
            </Text>
            {' 및 '}
            <Text
              style={{ color: Colors.text.accent, textDecorationLine: 'underline' }}
              onPress={() => Linking.openURL('https://pawprintapp.link/support/privacy')}
            >
              개인정보 처리방침
            </Text>
            에{'\n'}동의하는 것으로 간주됩니다
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

interface SocialButtonProps {
  provider: 'google' | 'apple';
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}

function SocialButton({ provider, loading, disabled, onPress }: SocialButtonProps) {
  const Colors = useColors();
  const isApple = provider === 'apple';
  // Apple HIG: Sign in with Apple 버튼은 검정/흰 only — useColors() 의 themed 토큰 대신 social 브랜드 색.
  const bg = isApple ? BrandColors.social.appleBlack : Colors.white;
  const fg = isApple ? Colors.white : Colors.text.primary;
  const border = isApple ? BrandColors.social.appleBlack : Colors.border;
  const label = isApple ? 'Apple로 계속하기' : 'Google로 계속하기';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: bg,
        borderWidth: 1.5,
        borderColor: border,
        borderRadius: Spacing.borderRadius.md,
        paddingVertical: 14,
        opacity: disabled && !loading ? 0.5 : 1,
      }}
    >
      {loading ? (
        <Feather name="loader" size={18} color={fg} />
      ) : isApple ? (
        <Text style={{ fontSize: Typography.size.heading, color: fg, marginTop: -2 }}></Text>
      ) : (
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: Colors.white,
            borderWidth: 1,
            borderColor: Colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: Typography.size.body, fontWeight: Typography.weight.bold, color: BrandColors.social.googleBlue }}>G</Text>
        </View>
      )}
      <Text
        style={{
          ...Typography.preset.button,
          color: fg,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface DevButtonProps {
  label: string;
  tone: 'primary' | 'neutral';
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}

function DevButton({ label, tone, loading, disabled, onPress }: DevButtonProps) {
  const Colors = useColors();
  const bg = tone === 'primary' ? Colors.secondaryLight : Colors.surface;
  const border = tone === 'primary' ? Colors.secondary : Colors.border;
  const fg = tone === 'primary' ? Colors.primaryDark : Colors.text.secondary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        borderRadius: Spacing.borderRadius.md,
        paddingVertical: 10,
        opacity: disabled && !loading ? 0.5 : 1,
      }}
    >
      <Feather name={loading ? 'loader' : 'tool'} size={14} color={fg} />
      <Text style={{ ...Typography.preset.label, color: fg }}>{label}</Text>
    </TouchableOpacity>
  );
}
