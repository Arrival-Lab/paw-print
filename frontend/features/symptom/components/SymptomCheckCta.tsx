import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';

/**
 * 홈 메인 CTA — 증상 검색해도 정확한 정보 못 찾는 페인포인트(설문 1순위)를
 * 한 번의 탭으로 해결할 수 있는 진입점. 슬림 row 형태.
 */
export default function SymptomCheckCta() {
  const Colors = useColors();
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push('/symptom-check' as any)}
      style={{
        backgroundColor: Colors.primaryLight,
        borderRadius: Spacing.borderRadius.lg,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name="zap" size={20} color={Colors.primaryDark} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary, fontWeight: Typography.weight.bold }}>
          {t('symptom.cta.title')}
        </Text>
        <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary }}>
          {t('symptom.cta.subtitle')}
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={Colors.text.tertiary} />
    </TouchableOpacity>
  );
}
