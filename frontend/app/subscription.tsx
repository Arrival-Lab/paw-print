import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../features/auth/store/authStore';
import { useUiStore } from '../shared/store/uiStore';
import { useIAPController, type Plan } from '../features/subscription/hooks/useSubscription';
import { isPaidTier } from '../features/subscription/api/subscriptionApi';
import { useColors } from '../shared/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { useLocaleStore } from '../shared/store/localeStore';
import { legalUrl } from '../constants/legal';
import { Config, Spacing, Typography } from '../constants';
import ScreenHeader from '../shared/components/ScreenHeader';
import Card from '../shared/components/Card';
import Button from '../shared/components/Button';
import Badge from '../shared/components/Badge';

// FRIEND/FAMILY 공통 혜택 — 양쪽 다 무제한인 항목만. 텍스트는 i18n subscription.benefit.*
const COMMON_BENEFITS: { icon: React.ComponentProps<typeof Feather>['name']; key: string }[] = [
  { icon: 'camera', key: 'photo' },
  { icon: 'trending-up', key: 'graph' },
  { icon: 'bell', key: 'alert' },
];

// 플랜별 차별점 — 한도 차이. 텍스트는 i18n subscription.diff.*
// 값은 백엔드 SubscriptionLimits (FREE/FRIEND/FAMILY) 와 일치시켜야 함.
const PLAN_DIFF_KEYS = ['pet', 'share', 'ocr', 'ai'];

function planLabel(plan: Plan, t: (k: string) => string): string {
  return t(`subscription.plan.${plan}`);
}


export default function SubscriptionScreen() {
  const Colors = useColors();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);
  const showLoginPrompt = useUiStore((s) => s.showLoginPrompt);
  const { purchase, restore, purchasing, restoring } = useIAPController();

  // 게스트도 플랜·혜택은 볼 수 있되 결제·복원은 로그인 권유.
  const isFree = isGuest ? true : user?.subscriptionType === 'FREE';
  const tierLabel = (() => {
    if (isGuest) return t('subscription.browsing');
    switch (user?.subscriptionType) {
      case 'FRIEND': return 'FRIEND';
      case 'FAMILY': return 'FAMILY';
      case 'PREMIUM': return 'PREMIUM';
      default: return 'FREE';
    }
  })();

  const [plan, setPlan] = useState<Plan>(Config.showFamilyYearly ? 'familyYearly' : 'familyMonthly');

  const friendMonthly = Config.friendPriceMonthly;
  const familyMonthly = Config.familyPriceMonthly;
  const familyYearly = Config.familyPriceYearly;
  const familyMonthlyIntro = Config.familyMonthlyIntroPrice;
  const familyYearlyPerMonth = Math.round(familyYearly / 12);
  const familySavingsPercent = Math.round(((familyMonthly * 12 - familyYearly) / (familyMonthly * 12)) * 100);

  const handlePurchase = async () => {
    if (isGuest) {
      showLoginPrompt(t('subscription.loginToSubscribe'));
      return;
    }
    try {
      await purchase(plan);
      Alert.alert(t('subscription.purchaseDone'), t('subscription.purchaseDoneMsg', { plan: planLabel(plan, t) }));
    } catch (e: any) {
      Alert.alert(t('subscription.purchaseFail'), e?.message ?? t('subscription.tryAgain'));
    }
  };

  const handleRestore = async () => {
    if (isGuest) {
      showLoginPrompt(t('subscription.loginToRestore'));
      return;
    }
    const status = await restore();
    if (isPaidTier(status?.subscriptionType)) {
      Alert.alert(t('subscription.restoreDone'), t('subscription.restoreDoneMsg'));
    } else {
      Alert.alert(t('subscription.restoreNone'), t('subscription.restoreNoneMsg'));
    }
  };

  const openManageSubscription = () => {
    const url = Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions';
    Linking.openURL(url).catch(() => Alert.alert(t('subscription.navFail'), t('subscription.navFailStore')));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }} edges={['top']}>
      <ScreenHeader title={t('subscription.title')} back />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xxxxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* 현재 플랜 카드 */}
        <Card variant="outlined" padding="lg" style={{ borderColor: isFree ? Colors.border : Colors.primary, borderWidth: 1.5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>{t('subscription.currentPlan')}</Text>
              <Text style={{ ...Typography.preset.h2, color: Colors.text.primary, marginTop: 4 }}>
                {tierLabel}
              </Text>
              <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginTop: 4 }}>
                {isGuest
                  ? t('subscription.guestPlanDesc')
                  : isFree
                    ? t('subscription.freePlanDesc')
                    : t('subscription.paidPlanDesc')}
              </Text>
            </View>
            <Badge tone={isFree ? 'neutral' : 'premium'}>
              {isFree ? 'FREE' : `${tierLabel} ✦`}
            </Badge>
          </View>
        </Card>

        {/* 분기 — 구독 중 / 미구독 */}
        {isFree ? (
          <>
            {/* 혜택 리스트 */}
            <Text
              style={{
                ...Typography.preset.label,
                color: Colors.text.tertiary,
                marginTop: Spacing.xl,
                marginBottom: Spacing.sm,
                textTransform: 'uppercase',
              }}
            >
              {t('subscription.premiumBenefits')}
            </Text>
            <Card variant="outlined" padding="none">
              {COMMON_BENEFITS.map((b, i) => (
                <View
                  key={b.key}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: Spacing.md,
                    padding: Spacing.lg,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: Colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: Colors.primaryLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Feather name={b.icon} size={16} color={Colors.primaryDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary, fontWeight: Typography.weight.semibold }}>
                      {t(`subscription.benefit.${b.key}Title`)}
                    </Text>
                    <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                      {t(`subscription.benefit.${b.key}Desc`)}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>

            {/* FRIEND vs FAMILY 차별점 비교 */}
            <Text
              style={{
                ...Typography.preset.label,
                color: Colors.text.tertiary,
                marginTop: Spacing.xl,
                marginBottom: Spacing.sm,
                textTransform: 'uppercase',
              }}
            >
              {t('subscription.planDiffTitle')}
            </Text>
            <Card variant="outlined" padding="none">
              {/* 헤더 행 */}
              <View
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: Colors.border,
                  backgroundColor: Colors.surface,
                }}
              >
                <Text style={{ flex: 1.4, ...Typography.preset.caption, color: Colors.text.tertiary }}>
                  {t('subscription.colItem')}
                </Text>
                <Text
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    ...Typography.preset.caption,
                    color: Colors.text.tertiary,
                  }}
                >
                  FREE
                </Text>
                <Text
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    ...Typography.preset.caption,
                    color: Colors.text.primary,
                    fontWeight: Typography.weight.bold,
                  }}
                >
                  FRIEND
                </Text>
                <Text
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    ...Typography.preset.caption,
                    color: Colors.primaryDark,
                    fontWeight: Typography.weight.bold,
                  }}
                >
                  FAMILY
                </Text>
              </View>
              {PLAN_DIFF_KEYS.map((key, i) => (
                <View
                  key={key}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: Spacing.lg,
                    paddingVertical: Spacing.md,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: Colors.border,
                  }}
                >
                  <Text style={{ flex: 1.4, ...Typography.preset.bodySmall, color: Colors.text.primary }}>
                    {t(`subscription.diff.${key}Label`)}
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      ...Typography.preset.bodySmall,
                      color: Colors.text.tertiary,
                    }}
                  >
                    {t(`subscription.diff.${key}Free`)}
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      ...Typography.preset.bodySmall,
                      color: Colors.text.secondary,
                    }}
                  >
                    {t(`subscription.diff.${key}Friend`)}
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      ...Typography.preset.bodySmall,
                      color: Colors.primaryDark,
                      fontWeight: Typography.weight.semibold,
                    }}
                  >
                    {t(`subscription.diff.${key}Family`)}
                  </Text>
                </View>
              ))}
            </Card>

            {/* 플랜 선택 */}
            <Text
              style={{
                ...Typography.preset.label,
                color: Colors.text.tertiary,
                marginTop: Spacing.xl,
                marginBottom: Spacing.sm,
                textTransform: 'uppercase',
              }}
            >
              {t('subscription.selectPlan')}
            </Text>
            <View style={{ gap: Spacing.sm }}>
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

            {/* 구독 시작 */}
            <View style={{ marginTop: Spacing.xl, gap: Spacing.sm }}>
              <Button variant="primary" fullWidth size="lg" onPress={handlePurchase} loading={purchasing}>
                {t('subscription.planStart', { plan: planLabel(plan, t) })}
              </Button>
              <TouchableOpacity
                onPress={handleRestore}
                disabled={restoring}
                style={{ alignItems: 'center', paddingVertical: Spacing.sm }}
              >
                <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary }}>
                  {restoring ? t('subscription.restoring') : t('subscription.restore')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 자동 갱신 안내 — Apple Review Guideline 3.1.2(a) 필수 항목. 구매 버튼 직하단에 노출. */}
            <AutoRenewDisclosure />
          </>
        ) : (
          <>
            {/* 구독 관리 */}
            <Text
              style={{
                ...Typography.preset.label,
                color: Colors.text.tertiary,
                marginTop: Spacing.xl,
                marginBottom: Spacing.sm,
                textTransform: 'uppercase',
              }}
            >
              {t('subscription.manageSection')}
            </Text>
            <Card variant="outlined" padding="none">
              <TouchableOpacity
                onPress={openManageSubscription}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: Spacing.lg,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ ...Typography.preset.body, color: Colors.text.primary }}>
                    {Platform.OS === 'ios' ? t('subscription.manageAppStore') : t('subscription.managePlayStore')}
                  </Text>
                  <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                    {t('subscription.manageDesc')}
                  </Text>
                </View>
                <Feather name="external-link" size={16} color={Colors.text.tertiary} />
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: Colors.border }} />
              <TouchableOpacity
                onPress={handleRestore}
                disabled={restoring}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: Spacing.lg,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ ...Typography.preset.body, color: Colors.text.primary }}>{t('subscription.restore')}</Text>
                  <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                    {t('subscription.restoreDesc')}
                  </Text>
                </View>
                <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.tertiary }}>
                  {restoring ? t('subscription.restoring') : ''}
                </Text>
              </TouchableOpacity>
            </Card>

            {/* 이용 중 혜택 */}
            <Text
              style={{
                ...Typography.preset.label,
                color: Colors.text.tertiary,
                marginTop: Spacing.xl,
                marginBottom: Spacing.sm,
                textTransform: 'uppercase',
              }}
            >
              {t('subscription.benefitsInUse')}
            </Text>
            <Card variant="outlined" padding="none">
              {COMMON_BENEFITS.map((b, i) => (
                <View
                  key={b.key}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.md,
                    padding: Spacing.md,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: Colors.border,
                  }}
                >
                  <Feather name="check" size={16} color={Colors.primaryDark} />
                  <Text style={{ flex: 1, ...Typography.preset.body, color: Colors.text.primary }}>
                    {t(`subscription.benefit.${b.key}Title`)}
                  </Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* 약관 링크 — 구독·미구독 양쪽에 노출. Apple 3.1.2(a) 의 EULA/Privacy Policy 필수 표시. */}
        <LegalLinks />
      </ScrollView>
    </SafeAreaView>
  );
}

function AutoRenewDisclosure() {
  const Colors = useColors();
  const { t } = useTranslation();
  const storeName = Platform.OS === 'ios' ? 'Apple ID' : 'Google Play';
  const settingsName = Platform.OS === 'ios' ? t('subscription.settingsIos') : t('subscription.settingsAndroid');
  return (
    <View style={{ marginTop: Spacing.lg, paddingHorizontal: Spacing.xs }}>
      <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, lineHeight: 18 }}>
        {t('subscription.autoRenew', { store: storeName, settings: settingsName })}
      </Text>
    </View>
  );
}

// Apple Guideline 3.1.2(a) / Google Play Subscriptions policy 충족을 위한 약관 링크 — locale 별 문서로 연결.
function LegalLinks() {
  const Colors = useColors();
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const open = (url: string) =>
    Linking.openURL(url).catch(() => Alert.alert(t('subscription.navFail'), t('subscription.navFailBrowser')));
  return (
    <View
      style={{
        marginTop: Spacing.xl,
        paddingTop: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
      }}
    >
      <TouchableOpacity onPress={() => open(legalUrl('privacy', locale))} hitSlop={Spacing.hitSlop}>
        <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, textDecorationLine: 'underline' }}>
          {t('legal.privacy')}
        </Text>
      </TouchableOpacity>
      <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>·</Text>
      <TouchableOpacity onPress={() => open(legalUrl('terms', locale))} hitSlop={Spacing.hitSlop}>
        <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, textDecorationLine: 'underline' }}>
          {t('legal.terms')}
        </Text>
      </TouchableOpacity>
    </View>
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
