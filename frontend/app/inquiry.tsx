import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Linking, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import ScreenHeader from '../shared/components/ScreenHeader';
import Card from '../shared/components/Card';

const SUPPORT_EMAIL = 'chaeon.studio@gmail.com';

export default function InquiryScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const handleEmailPress = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t('help.inquiry.emailSubject'))}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert(t('help.inquiry.cannotOpenEmail'), t('help.inquiry.emailManual', { email: SUPPORT_EMAIL }));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader title={t('help.items.inquiry.label')} back />

      <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
        <Card variant="elevated" padding="lg">
          <Text style={{ ...Typography.preset.title, color: Colors.text.primary, marginBottom: Spacing.sm }}>
            {t('help.inquiry.emailTitle')}
          </Text>
          <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginBottom: Spacing.md }}>
            {t('help.inquiry.emailDesc')}
          </Text>
          <TouchableOpacity
            onPress={handleEmailPress}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm,
              backgroundColor: Colors.primaryLight,
              borderRadius: Spacing.borderRadius.md,
              padding: Spacing.md,
            }}
          >
            <Feather name="mail" size={18} color={Colors.primary} />
            <Text style={{ ...Typography.preset.bodyMedium, color: Colors.primaryDark }}>
              {SUPPORT_EMAIL}
            </Text>
            <Feather
              name="external-link"
              size={14}
              color={Colors.primary}
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>
        </Card>

        <Card variant="tinted" padding="lg">
          <Text style={{ ...Typography.preset.title, color: Colors.text.primary, marginBottom: Spacing.sm }}>
            {t('help.inquiry.includeTitle')}
          </Text>
          {(t('help.inquiry.includeItems', { returnObjects: true }) as string[]).map((item) => (
            <View key={item} style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: Spacing.xs }}>
              <Text style={{ color: Colors.primary, marginRight: Spacing.sm, lineHeight: 22 }}></Text>
              <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, flex: 1 }}>
                {item}
              </Text>
            </View>
          ))}
        </Card>
      </View>
    </SafeAreaView>
  );
}
