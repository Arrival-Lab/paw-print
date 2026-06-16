import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { useUiStore } from '../../../shared/store/uiStore';
import { Config, Spacing, Typography } from '../../../constants';
import { useColors, useTheme } from '../../../shared/hooks/useTheme';
import { useIAPController, type Plan } from '../hooks/useSubscription';
import Button from '../../../shared/components/Button';
import GlassOverlay from '../../../shared/components/GlassOverlay';
import { useBottomSheetSafePadding } from '../../../shared/hooks/useBottomSheetSafePadding';

// FRIEND/FAMILY 공통 혜택 — 두 플랜 모두 무제한인 항목만. 텍스트는 i18n subscription.benefit.*
const BENEFITS: { icon: React.ComponentProps<typeof Feather>['name']; key: string }[] = [
  { icon: 'camera', key: 'photo' },
  { icon: 'trending-up', key: 'graph' },
  { icon: 'bell', key: 'alert' },
];

export default function PremiumModal() {
  // useIAPController() 가 항상 mount 되면 expo-iap 의 getPromotedProductIOS 가 무한 polling 하며
  // JS thread 를 막아 cold start 흰 화면 freeze 유발. visible 일 때만 inner mount 해 hook 호출 회피.
  const isVisible = useUiStore((s) => s.isPremiumModalVisible);
  if (!isVisible) return null;
  return <PremiumModalContent />;
}

function PremiumModalContent() {
  const { isPremiumModalVisible, premiumModalMessage, premiumModalFirstHit, hidePremiumModal } = useUiStore();
  const [plan, setPlan] = useState<Plan>(Config.showFamilyYearly ? 'familyYearly' : 'familyMonthly');
  const Colors = useColors();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const padBottom = useBottomSheetSafePadding();
  const { purchase, purchasing } = useIAPController();

  const friendMonthly = Config.friendPriceMonthly;
  const familyMonthly = Config.familyPriceMonthly;
  const familyYearly = Config.familyPriceYearly;
  const familyMonthlyIntro = Config.familyMonthlyIntroPrice;
  const familyYearlyPerMonth = Math.round(familyYearly / 12);
  const familySavingsPercent = Math.round(((familyMonthly * 12 - familyYearly) / (familyMonthly * 12)) * 100);

  const handlePurchase = async () => {
    try {
      await purchase(plan);
      hidePremiumModal();
      Alert.alert(t('subscription.purchaseDone'), t('subscription.purchaseDoneMsg', { plan: planLabel(plan, t) }));
    } catch (e: any) {
      Alert.alert(t('subscription.purchaseFail'), e?.message ?? t('subscription.tryAgain'));
    }
  };

  return (
    <Modal
      visible={isPremiumModalVisible}
      transparent
      animationType="fade"
      onRequestClose={hidePremiumModal}
      statusBarTranslucent
    >
      <GlassOverlay onPress={hidePremiumModal} style={{ justifyContent: 'flex-end' }}>
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
            maxHeight: '92%',
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
              paddingTop: Spacing.md,
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
              marginBottom: Spacing.lg,
            }}
          />

          <Pressable
            onPress={hidePremiumModal}
            hitSlop={Spacing.hitSlop}
            style={{ position: 'absolute', top: Spacing.lg, right: Spacing.lg, zIndex: 1 }}
          >
            <Feather name="x" size={22} color={Colors.text.secondary} />
          </Pressable>

          <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.xxl }} showsVerticalScrollIndicator={false}>
            <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: Colors.premiumBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: Spacing.md,
                }}
              >
                <Feather name="star" size={28} color={Colors.premiumText} />
              </View>
              <Text style={{ ...Typography.preset.h2, color: Colors.text.primary, textAlign: 'center' }}>
                {premiumModalFirstHit ? t('subscription.firstHitTitle') : t('subscription.upsellTitle')}
              </Text>
              {premiumModalMessage ? (
                <Text
                  style={{
                    marginTop: Spacing.sm,
                    ...Typography.preset.body,
                    color: Colors.text.secondary,
                    textAlign: 'center',
                  }}
                >
                  {premiumModalMessage}
                </Text>
              ) : null}
              {premiumModalFirstHit ? (
                <Text
                  style={{
                    marginTop: Spacing.sm,
                    ...Typography.preset.bodySmall,
                    color: Colors.text.tertiary,
                    textAlign: 'center',
                  }}
                >
                  {t('subscription.firstHitNote')}
                </Text>
              ) : null}
            </View>

            <View style={{ gap: Spacing.md, marginBottom: Spacing.xl }}>
              {BENEFITS.map((b) => (
                <View
                  key={b.key}
                  style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: Colors.primaryLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Feather name={b.icon} size={18} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...Typography.preset.title, color: Colors.text.primary }}>{t(`subscription.benefit.${b.key}Title`)}</Text>
                    <Text
                      style={{
                        marginTop: 2,
                        ...Typography.preset.bodySmall,
                        color: Colors.text.secondary,
                      }}
                    >
                      {t(`subscription.benefit.${b.key}Desc`)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={{ gap: Spacing.sm, marginBottom: Spacing.lg }}>
              {Config.showFamilyYearly ? (
                <PlanOption
                  selected={plan === 'familyYearly'}
                  onPress={() => setPlan('familyYearly')}
                  title={t('subscription.plan.familyYearly')}
                  price={t('subscription.pricePerYear', { price: familyYearly.toLocaleString() })}
                  meta={t('subscription.familyYearlyMeta', { perMonth: familyYearlyPerMonth.toLocaleString(), percent: familySavingsPercent })}
                  badge={t('subscription.recommend')}
                />
              ) : null}
              <PlanOption
                selected={plan === 'familyMonthly'}
                onPress={() => setPlan('familyMonthly')}
                title={t('subscription.plan.familyMonthly')}
                price={t('subscription.pricePerMonth', { price: familyMonthly.toLocaleString() })}
                meta={familyMonthlyIntro
                  ? t('subscription.familyMonthlyIntroMeta', { intro: familyMonthlyIntro.toLocaleString() })
                  : t('subscription.familyMonthlyMeta')}
                badge={familyMonthlyIntro ? t('subscription.introBadge', { intro: familyMonthlyIntro.toLocaleString() }) : (Config.showFamilyYearly ? undefined : t('subscription.recommend'))}
              />
              <PlanOption
                selected={plan === 'friendMonthly'}
                onPress={() => setPlan('friendMonthly')}
                title={t('subscription.plan.friendMonthly')}
                price={t('subscription.pricePerMonth', { price: friendMonthly.toLocaleString() })}
                meta={t('subscription.friendMeta')}
              />
            </View>

            {premiumModalFirstHit ? (
              <>
                <Button variant="primary" fullWidth size="lg" onPress={hidePremiumModal}>
                  {t('subscription.keepFree')}
                </Button>
                <View style={{ height: Spacing.sm }} />
                <Button variant="ghost" fullWidth onPress={handlePurchase} loading={purchasing}>
                  {t('subscription.planStart', { plan: planLabel(plan, t) })}
                </Button>
              </>
            ) : (
              <>
                <Button variant="primary" fullWidth size="lg" onPress={handlePurchase} loading={purchasing}>
                  {t('subscription.planStart', { plan: planLabel(plan, t) })}
                </Button>
                <View style={{ height: Spacing.sm }} />
                <Button variant="ghost" fullWidth onPress={hidePremiumModal}>
                  {t('subscription.later')}
                </Button>
              </>
            )}

            <Text
              style={{
                ...Typography.preset.caption,
                color: Colors.text.tertiary,
                textAlign: 'center',
                marginTop: Spacing.md,
              }}
            >
              {t('subscription.manageNote')}
            </Text>
          </ScrollView>
          </View>
        </Pressable>
      </GlassOverlay>
    </Modal>
  );
}

interface PlanOptionProps {
  selected: boolean;
  onPress: () => void;
  title: string;
  price: string;
  meta: string;
  badge?: string;
}

function planLabel(plan: Plan, t: (k: string) => string): string {
  return t(`subscription.plan.${plan}`);
}

function PlanOption({ selected, onPress, title, price, meta, badge }: PlanOptionProps) {
  const Colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? Colors.primary : Colors.border,
        backgroundColor: selected ? Colors.primaryLight : Colors.white,
        borderRadius: Spacing.borderRadius.lg,
        padding: Spacing.lg,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <Text style={{ ...Typography.preset.title, color: Colors.text.primary }}>{title}</Text>
            {badge ? (
              <View
                style={{
                  backgroundColor: Colors.primary,
                  paddingHorizontal: Spacing.sm,
                  paddingVertical: 2,
                  borderRadius: Spacing.borderRadius.full,
                }}
              >
                <Text style={{ ...Typography.preset.caption, color: Colors.white }}>{badge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={{ marginTop: 4, ...Typography.preset.bodySmall, color: Colors.text.secondary }}>
            {meta}
          </Text>
        </View>
        <Text style={{ ...Typography.preset.title, color: Colors.primary }}>{price}</Text>
      </View>
    </TouchableOpacity>
  );
}
