import { Modal, Platform, StyleSheet, View, Text, ScrollView, TouchableOpacity, Pressable, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors, useTheme } from '../../../shared/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import i18n from '../../../shared/i18n';
import { useBottomSheetSafePadding } from '../../../shared/hooks/useBottomSheetSafePadding';
import GlassOverlay from '../../../shared/components/GlassOverlay';

export interface MonthlyTip {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  body: string;
}

export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

const MONTHLY_TIP_ICONS: Record<Month, MonthlyTip["icon"][]> = {
  1: ['cloud-snow', 'alert-circle', 'alert-circle', 'droplet', 'droplet', 'alert-triangle', 'zap', 'wind', 'wind', 'activity', 'activity', 'alert-octagon', 'alert-triangle', 'package', 'search'],
  2: ['cloud-snow', 'clock', 'droplet', 'search', 'droplet', 'alert-triangle', 'activity', 'bar-chart', 'calendar', 'shield', 'square', 'alert-circle', 'eye', 'link', 'clipboard'],
  3: ['shield', 'search', 'heart', 'eye', 'droplet', 'alert-octagon', 'alert-octagon', 'alert-octagon', 'square', 'alert-triangle', 'alert-octagon', 'feather', 'disc', 'tag', 'calendar'],
  4: ['shield', 'shield', 'heart', 'droplet', 'eye', 'search', 'alert-triangle', 'alert-octagon', 'package', 'link', 'alert-triangle', 'search', 'alert-circle', 'alert-octagon', 'clipboard'],
  5: ['thermometer', 'clock', 'alert-circle', 'droplet', 'alert-triangle', 'heart', 'search', 'disc', 'wind', 'scissors', 'calendar', 'package', 'alert-octagon', 'slash', 'search'],
  6: ['thermometer', 'clock', 'alert-triangle', 'droplet', 'umbrella', 'alert-circle', 'wind', 'activity', 'search', 'disc', 'heart', 'shield', 'slash', 'life-buoy', 'package'],
  7: ['thermometer', 'clock', 'alert-triangle', 'thermometer', 'droplet', 'alert-circle', 'life-buoy', 'alert-octagon', 'alert-circle', 'wind', 'search', 'heart', 'alert-circle', 'package', 'trash-2'],
  8: ['thermometer', 'droplet', 'alert-circle', 'alert-triangle', 'wind', 'thermometer', 'search', 'alert-octagon', 'heart', 'shield', 'slash', 'search', 'alert-circle', 'check-square', 'package'],
  9: ['thermometer', 'shield', 'search', 'heart', 'wind', 'feather', 'droplet', 'link', 'search', 'alert-octagon', 'alert-octagon', 'tag', 'eye', 'activity', 'clipboard'],
  10: ['shield', 'search', 'alert-octagon', 'alert-octagon', 'slash', 'slash', 'tag', 'gift', 'volume-2', 'alert-triangle', 'activity', 'feather', 'droplet', 'activity', 'bar-chart'],
  11: ['clipboard', 'alert-triangle', 'alert-circle', 'droplet', 'wind', 'wind', 'droplet', 'activity', 'slash', 'trash-2', 'slash', 'package', 'alert-octagon', 'activity', 'clock'],
  12: ['cloud-snow', 'alert-circle', 'alert-circle', 'droplet', 'alert-triangle', 'alert-triangle', 'zap', 'gift', 'alert-triangle', 'slash', 'volume-2', 'alert-triangle', 'alert-octagon', 'package', 'bar-chart'],
};

export function getCurrentMonth(): Month {
  return (new Date().getMonth() + 1) as Month;
}

export function getMonthlyTips(month: Month = getCurrentMonth()): MonthlyTip[] {
  const icons = MONTHLY_TIP_ICONS[month];
  const items = i18n.t(`care.monthly.${month}`, { returnObjects: true }) as { title: string; body: string }[];
  return icons.map((icon, idx) => ({ icon, title: items[idx]?.title ?? '', body: items[idx]?.body ?? '' }));
}

export function getMonthlyTip(month: Month = getCurrentMonth()): MonthlyTip {
  const tips = getMonthlyTips(month);
  return tips[Math.floor(Math.random() * tips.length)];
}

export default function MonthlyCareGuideModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const Colors = useColors();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const padBottom = useBottomSheetSafePadding();
  const month = getCurrentMonth();
  const tips = getMonthlyTips(month);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <GlassOverlay onPress={onClose} style={{ justifyContent: 'flex-end' }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            borderTopLeftRadius: Spacing.borderRadius.xxl,
            borderTopRightRadius: Spacing.borderRadius.xxl,
            overflow: 'hidden',
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: Colors.glass.border,
            maxHeight: '85%',
          }}
        >
          <BlurView
            intensity={50}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={{
              backgroundColor: Colors.glass.surfaceStrong,
              padding: Spacing.lg,
              paddingBottom: padBottom,
            }}
          >
          <View
            style={{
              alignSelf: 'center',
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.border,
              marginBottom: Spacing.md,
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg }}>
            <Text style={{ ...Typography.preset.title, color: Colors.text.primary, fontWeight: Typography.weight.bold }}>
              {t('care.monthlyGuideTitle', { month })}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={Spacing.hitSlop}>
              <Text style={{ ...Typography.preset.body, color: Colors.text.secondary }}>{t('action.close')}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm, paddingBottom: Spacing.lg }} nestedScrollEnabled>
            {tips.map((tip, i) => (
              <View
                key={i}
                style={{
                  padding: Spacing.md,
                  backgroundColor: Colors.primaryLight,
                  borderRadius: Spacing.borderRadius.lg,
                  flexDirection: 'row',
                  gap: Spacing.md,
                  alignItems: 'flex-start',
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: Colors.white,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    source={require('../../../assets/icon.png')}
                    style={{ width: 24, height: 24, borderRadius: 5 }}
                    resizeMode="contain"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary, fontWeight: Typography.weight.semibold }}>
                    {tip.title}
                  </Text>
                  <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginTop: Spacing.xs }}>
                    {tip.body}
                  </Text>
                </View>
              </View>
            ))}
            <Text
              style={{
                ...Typography.preset.caption,
                color: Colors.text.tertiary,
                marginTop: Spacing.md,
                paddingHorizontal: Spacing.xs,
                lineHeight: Typography.size.xs * Typography.lineHeight.relaxed,
              }}
            >
              {t('care.monthlyDisclaimer')}
            </Text>
          </ScrollView>
          </View>
        </Pressable>
      </GlassOverlay>
    </Modal>
  );
}
