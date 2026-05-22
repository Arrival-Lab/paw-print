import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';

/**
 * 홈 메인 CTA — 증상 검색해도 정확한 정보 못 찾는 페인포인트(설문 1순위)를
 * 한 번의 탭으로 해결할 수 있는 진입점.
 */
export default function SymptomCheckCta() {
  const Colors = useColors();
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push('/symptom-check' as any)}
      style={{
        backgroundColor: Colors.primary,
        borderRadius: Spacing.borderRadius.lg,
        padding: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: Colors.glass.highlight,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name="zap" size={22} color={Colors.text.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ ...Typography.preset.title, color: Colors.text.primary }}>
          어디가 아픈지 모르겠다면
        </Text>
        <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.primary, marginTop: 2, opacity: 0.85 }}>
          증상 한 줄로 AI 1차 체크 받기
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color={Colors.text.primary} />
    </TouchableOpacity>
  );
}
