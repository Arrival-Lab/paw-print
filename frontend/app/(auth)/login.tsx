import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Colors, Config, Typography, Spacing } from '../../constants';
import { authApi } from '../../features/auth/api/authApi';
import { useAuthStore } from '../../features/auth/store/authStore';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    clientId: Config.googleWebClientId || undefined,
    iosClientId: Config.googleIosClientId || undefined,
    androidClientId: Config.googleAndroidClientId || undefined,
    scopes: ['openid', 'email', 'profile'],
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.authentication?.idToken;
      if (idToken) {
        handleGoogleLogin(idToken);
      } else {
        setLoading(null);
        Alert.alert('오류', 'Google 로그인에 실패했습니다.');
      }
    } else if (googleResponse?.type === 'error' || googleResponse?.type === 'cancel') {
      setLoading(null);
    }
  }, [googleResponse]);

  const handleGoogleLogin = async (idToken: string) => {
    try {
      const data = await authApi.googleLogin(idToken) as any;
      authApi.saveTokens(data.accessToken, data.refreshToken);
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.replace('/(tabs)');
    } catch (e) {
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

  const onGooglePress = () => {
    setLoading('google');
    promptGoogleAsync();
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
          {/* Google 로그인 */}
          <TouchableOpacity
            onPress={onGooglePress}
            disabled={loading !== null}
            className="w-full flex-row items-center justify-center rounded-xl border border-gray-200 bg-white py-4 gap-3"
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
