import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Colors, Config, Typography } from '../../constants';
import { authApi } from '../../features/auth/api/authApi';
import { useAuthStore } from '../../features/auth/store/authStore';
import { setAccessToken, setRefreshToken } from '../../shared/utils/storage';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);

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
      const appleAuth = require('@invertase/react-native-apple-authentication').default;
      const credential = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });
      const { identityToken } = credential;
      if (!identityToken) throw new Error('No identity token');

      const data = await authApi.appleLogin(identityToken) as any;
      authApi.saveTokens(data.accessToken, data.refreshToken);
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e?.code !== '1001') {
        Alert.alert('오류', '로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-between px-6 py-10">

        {/* 로고 영역 */}
        <View className="flex-1 items-center justify-center gap-3">
          <Text style={{ fontSize: 64 }}>🐾</Text>
          <Text
            style={{
              fontSize: Typography.size.display,
              fontWeight: Typography.weight.bold,
              color: Colors.primary,
            }}
          >
            발자국
          </Text>
          <Text
            style={{
              fontSize: Typography.size.md,
              color: Colors.text.secondary,
            }}
          >
            반려동물 건강 기록 서비스
          </Text>
        </View>

        {/* 로그인 버튼 영역 */}
        <View className="w-full gap-3">
          {/* Dev 로그인 (로컬 전용) */}
          {__DEV__ && (
            <TouchableOpacity
              onPress={async () => {
                setLoading('google');
                try {
                  const data = await authApi.devLogin() as any;
                  authApi.saveTokens(data.accessToken, data.refreshToken);
                  setAuth(data.user, data.accessToken, data.refreshToken);
                  router.replace('/(tabs)');
                } catch {
                  Alert.alert('오류', 'Dev 로그인 실패 (백엔드 로컬 실행 중인지 확인)');
                } finally {
                  setLoading(null);
                }
              }}
              disabled={loading !== null}
              className="w-full flex-row items-center justify-center rounded-xl py-4 gap-3"
              style={{ backgroundColor: Colors.status.warning, opacity: loading !== null ? 0.6 : 1 }}>
              <Text style={{ fontSize: Typography.size.md, fontWeight: Typography.weight.semibold,
                color: Colors.white }}>
                🛠 Dev Login (Premium)
              </Text>
            </TouchableOpacity>
          )}

          {/* Google 로그인 */}
          <TouchableOpacity
            onPress={handleGoogleLogin}
            disabled={loading !== null}
            className="w-full flex-row items-center justify-center rounded-xl border border-border bg-white py-4 gap-3"
            style={{ opacity: loading !== null ? 0.6 : 1 }}
          >
            {loading === 'google' ? (
              <ActivityIndicator size="small" color={Colors.text.secondary} />
            ) : (
              <Text style={{ fontSize: 20 }}>G</Text>
            )}
            <Text
              style={{
                fontSize: Typography.size.md,
                fontWeight: Typography.weight.semibold,
                color: Colors.text.primary,
              }}
            >
              Google로 계속하기
            </Text>
          </TouchableOpacity>

          {/* Apple 로그인 (iOS only) */}
          {(Platform.OS === 'ios' || Platform.OS === 'macos') && (
            <TouchableOpacity
              onPress={handleAppleLogin}
              disabled={loading !== null}
              className="w-full flex-row items-center justify-center rounded-xl bg-black py-4 gap-3"
              style={{ opacity: loading !== null ? 0.6 : 1 }}
            >
              {loading === 'apple' ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={{ fontSize: 20, color: Colors.white }}></Text>
              )}
              <Text
                style={{
                  fontSize: Typography.size.md,
                  fontWeight: Typography.weight.semibold,
                  color: Colors.text.inverse,
                }}
              >
                Apple로 계속하기
              </Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    </SafeAreaView>
  );
}
