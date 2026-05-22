import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../features/auth/store/authStore';
import { usePurchase, useRestorePurchase, type Plan } from '../features/subscription/hooks/useSubscription';
import { isPaidTier } from '../features/subscription/api/subscriptionApi';
import { useColors } from '../shared/hooks/useTheme';
import { Config, Spacing, Typography } from '../constants';
import ScreenHeader from '../shared/components/ScreenHeader';
import Card from '../shared/components/Card';
import Button from '../shared/components/Button';
import Badge from '../shared/components/Badge';

const BENEFITS: { icon: React.ComponentProps<typeof Feather>['name']; title: string; desc: string }[] = [
  { icon: 'heart', title: '반려동물 무제한', desc: '여러 마리도 한 곳에서 안전하게 관리' },
  { icon: 'camera', title: '사진 첨부 무제한', desc: '진료기록·다이어리당 사진 제한 없이 보관' },
  { icon: 'cpu', title: '처방전 자동 인식 무제한', desc: '사진만 올리면 자동으로 정리' },
  { icon: 'trending-up', title: '전체 기간 그래프', desc: '체중·식사·증상 추이를 한눈에' },
  { icon: 'bell', title: '예방접종 알림 무제한', desc: '백신 일정을 놓치지 않도록' },
  { icon: 'users', title: '가족·친구 공유 무제한', desc: '여러 명이 함께 케어' },
];

function planLabel(plan: Plan): string {
  switch (plan) {
    case 'friendMonthly': return 'Friend 월간';
    case 'familyMonthly': return 'Family 월간';
    case 'familyYearly': return 'Family 연간';
  }
}

export default function SubscriptionScreen() {
  const Colors = useColors();
  const user = useAuthStore((s) => s.user);
  const { purchase, loading: purchasing } = usePurchase();
  const { restore, loading: restoring } = useRestorePurchase();

  const isFree = user?.subscriptionType === 'FREE';
  const tierLabel = (() => {
    switch (user?.subscriptionType) {
      case 'FRIEND': return 'FRIEND';
      case 'FAMILY': return 'FAMILY';
      case 'PREMIUM': return 'PREMIUM';
      default: return 'FREE';
    }
  })();

  const [plan, setPlan] = useState<Plan>('familyYearly');

  const friendMonthly = Config.friendPriceMonthly;
  const familyMonthly = Config.familyPriceMonthly;
  const familyYearly = Config.familyPriceYearly;
  const familyYearlyPerMonth = Math.round(familyYearly / 12);
  const familySavingsPercent = Math.round(((familyMonthly * 12 - familyYearly) / (familyMonthly * 12)) * 100);

  const handlePurchase = async () => {
    try {
      await purchase(plan);
      Alert.alert('구독 완료', `${planLabel(plan)} 구독이 시작됐어요.`);
    } catch (e: any) {
      Alert.alert('구매 실패', e?.message ?? '다시 시도해주세요.');
    }
  };

  const handleRestore = async () => {
    const status = await restore();
    if (isPaidTier(status?.subscriptionType)) {
      Alert.alert('복원 완료', '구독이 복원됐어요.');
    } else {
      Alert.alert('복원 결과 없음', '복원할 구매 내역이 없어요.');
    }
  };

  const openManageSubscription = () => {
    const url = Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions';
    Linking.openURL(url).catch(() => Alert.alert('이동 실패', '스토어 구독 페이지로 이동할 수 없어요.'));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }} edges={['top']}>
      <ScreenHeader title="프리미엄 멤버십" back />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xxxxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* 현재 플랜 카드 */}
        <Card variant="outlined" padding="lg" style={{ borderColor: isFree ? Colors.border : Colors.primary, borderWidth: 1.5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>현재 플랜</Text>
              <Text style={{ ...Typography.preset.h2, color: Colors.text.primary, marginTop: 4 }}>
                {tierLabel}
              </Text>
              <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginTop: 4 }}>
                {isFree
                  ? '핵심 기능은 무료로 이용할 수 있어요.'
                  : '모든 기능을 제한 없이 이용 중이에요.'}
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
              프리미엄 혜택
            </Text>
            <Card variant="outlined" padding="none">
              {BENEFITS.map((b, i) => (
                <View
                  key={b.title}
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
                      {b.title}
                    </Text>
                    <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                      {b.desc}
                    </Text>
                  </View>
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
              플랜 선택
            </Text>
            <View style={{ gap: Spacing.sm }}>
              <PlanOption
                selected={plan === 'familyYearly'}
                onPress={() => setPlan('familyYearly')}
                title="Family 연간"
                price={`${familyYearly.toLocaleString()}원/년`}
                meta={`월 ${familyYearlyPerMonth.toLocaleString()}원 · ${familySavingsPercent}% 할인 · 전부 무제한`}
                badge="추천"
              />
              <PlanOption
                selected={plan === 'familyMonthly'}
                onPress={() => setPlan('familyMonthly')}
                title="Family 월간"
                price={`${familyMonthly.toLocaleString()}원/월`}
                meta="전부 무제한 · 언제든 해지"
              />
              <PlanOption
                selected={plan === 'friendMonthly'}
                onPress={() => setPlan('friendMonthly')}
                title="Friend 월간"
                price={`${friendMonthly.toLocaleString()}원/월`}
                meta="기본기 위주 · 가볍게 시작"
              />
            </View>

            {/* 구독 시작 */}
            <View style={{ marginTop: Spacing.xl, gap: Spacing.sm }}>
              <Button variant="primary" fullWidth size="lg" onPress={handlePurchase} loading={purchasing}>
                {planLabel(plan)} 시작하기
              </Button>
              <TouchableOpacity
                onPress={handleRestore}
                disabled={restoring}
                style={{ alignItems: 'center', paddingVertical: Spacing.sm }}
              >
                <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary }}>
                  {restoring ? '복원 중...' : '구매 복원'}
                </Text>
              </TouchableOpacity>
            </View>
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
              구독 관리
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
                    {Platform.OS === 'ios' ? 'App Store 구독 관리' : 'Play 스토어 구독 관리'}
                  </Text>
                  <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                    플랜 변경·해지는 스토어 설정에서 진행해주세요
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
                  <Text style={{ ...Typography.preset.body, color: Colors.text.primary }}>구매 복원</Text>
                  <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                    기기를 변경했거나 구독이 누락된 경우
                  </Text>
                </View>
                <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.tertiary }}>
                  {restoring ? '복원 중...' : ''}
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
              이용 중 혜택
            </Text>
            <Card variant="outlined" padding="none">
              {BENEFITS.map((b, i) => (
                <View
                  key={b.title}
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
                    {b.title}
                  </Text>
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
