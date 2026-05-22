import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Config, Spacing, Typography, Elevation } from '../../constants';
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
  const queryClient = useQueryClient();

  const handleGoogleLogin = async () => {
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
    }
  };

  const handleAppleLogin = async () => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'macos') return;
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
    }
  };

  const handleDev = async (kind: 'dev-premium' | 'dev-free') => {
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
              onPress={() => Linking.openURL('https://api.pawprintapp.link/terms.html')}
            >
              서비스 이용약관
            </Text>
            {' 및 '}
            <Text
              style={{ color: Colors.text.accent, textDecorationLine: 'underline' }}
              onPress={() => Linking.openURL('https://api.pawprintapp.link/privacy.html')}
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
  const bg = isApple ? '#000000' : Colors.white;
  const fg = isApple ? Colors.white : Colors.text.primary;
  const border = isApple ? '#000000' : Colors.border;
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
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: Colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: Typography.size.body, fontWeight: Typography.weight.bold, color: '#4285F4' }}>G</Text>
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
