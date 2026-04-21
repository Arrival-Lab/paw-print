import React from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../constants';

const SUPPORT_EMAIL = 'support@arrivallab.com';

export default function InquiryScreen() {
  const handleEmailPress = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=발자국 앱 문의`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert('이메일 앱을 열 수 없어요', `${SUPPORT_EMAIL} 으로 직접 메일을 보내주세요.`);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, marginLeft: Spacing.md, fontSize: Typography.size.lg,
          fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>
          문의하기
        </Text>
      </View>

      <View style={{ flex: 1, padding: Spacing.lg }}>
        <View style={{ backgroundColor: Colors.surface, borderRadius: Spacing.borderRadius.lg,
          padding: Spacing.lg, marginBottom: Spacing.lg }}>
          <Text style={{ fontSize: Typography.size.md, fontWeight: Typography.weight.semibold,
            color: Colors.text.primary, marginBottom: Spacing.sm }}>
            이메일 문의
          </Text>
          <Text style={{ fontSize: Typography.size.sm, color: Colors.text.secondary,
            lineHeight: Typography.size.sm * Typography.lineHeight.normal, marginBottom: Spacing.md }}>
            궁금한 점이나 불편한 점이 있으시면 아래 이메일로 문의해 주세요.
            영업일 기준 1-2일 내에 답변 드리겠습니다.
          </Text>
          <TouchableOpacity
            onPress={handleEmailPress}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryLight,
              borderRadius: Spacing.borderRadius.md, padding: Spacing.md }}>
            <Feather name="mail" size={18} color={Colors.primary} style={{ marginRight: Spacing.sm }} />
            <Text style={{ fontSize: Typography.size.md, color: Colors.primary,
              fontWeight: Typography.weight.medium }}>
              {SUPPORT_EMAIL}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: Colors.surface, borderRadius: Spacing.borderRadius.lg,
          padding: Spacing.lg }}>
          <Text style={{ fontSize: Typography.size.md, fontWeight: Typography.weight.semibold,
            color: Colors.text.primary, marginBottom: Spacing.sm }}>
            문의 시 포함해 주세요
          </Text>
          {['기기 종류 및 OS 버전', '앱 버전', '문제 발생 상황 및 재현 방법', '스크린샷 (있는 경우)'].map((item) => (
            <View key={item} style={{ flexDirection: 'row', alignItems: 'flex-start',
              marginBottom: Spacing.xs }}>
              <Text style={{ color: Colors.primary, marginRight: Spacing.sm, lineHeight: 20 }}>•</Text>
              <Text style={{ fontSize: Typography.size.sm, color: Colors.text.secondary, flex: 1 }}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
