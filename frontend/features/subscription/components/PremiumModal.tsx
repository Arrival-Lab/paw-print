import { useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { useUiStore } from '../../../shared/store/uiStore';
import { Config, Spacing, Typography } from '../../../constants';
import { useColors, useTheme } from '../../../shared/hooks/useTheme';
import { useIAPController, type Plan } from '../hooks/useSubscription';
import Button from '../../../shared/components/Button';
import GlassOverlay from '../../../shared/components/GlassOverlay';

const BENEFITS: { icon: React.ComponentProps<typeof Feather>['name']; title: string; desc: string }[] = [
  { icon: 'heart', title: '반려동물 무제한', desc: '여러 마리도 한 곳에서 안전하게 관리' },
  { icon: 'camera', title: '사진 첨부 무제한', desc: '진료기록당 사진 제한 없이 보관' },
  { icon: 'cpu', title: '처방전 자동 인식 무제한', desc: '사진만 올리면 자동으로 정리' },
  { icon: 'zap', title: 'AI 증상 체크 무제한', desc: '어디가 아픈지 모를 때 언제든' },
  { icon: 'trending-up', title: '전체 기간 그래프', desc: '체중·식사·증상 추이를 한눈에' },
  { icon: 'bell', title: '예방접종 알림 무제한', desc: '백신 일정을 놓치지 않도록' },
  { icon: 'users', title: '가족·친구 공유 무제한', desc: '여러 명이 함께 케어' },
];

export default function PremiumModal() {
  const { isPremiumModalVisible, premiumModalMessage, premiumModalFirstHit, hidePremiumModal } = useUiStore();
  const [plan, setPlan] = useState<Plan>(Config.showFamilyYearly ? 'familyYearly' : 'familyMonthly');
  const Colors = useColors();
  const { isDark } = useTheme();
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
      Alert.alert('구독 완료', `${planLabel(plan)} 구독이 시작됐어요.`);
    } catch (e: any) {
      Alert.alert('구매 실패', e?.message ?? '다시 시도해주세요.');
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
              paddingBottom: Spacing.xxxl,
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
                {premiumModalFirstHit ? '여기까지가 무료 한도예요' : '프리미엄으로 더 가까이'}
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
                  지금 결정하지 않으셔도 괜찮아요. 필요해질 때 다시 안내드릴게요.
                </Text>
              ) : null}
            </View>

            <View style={{ gap: Spacing.md, marginBottom: Spacing.xl }}>
              {BENEFITS.map((b) => (
                <View
                  key={b.title}
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
                    <Text style={{ ...Typography.preset.title, color: Colors.text.primary }}>{b.title}</Text>
                    <Text
                      style={{
                        marginTop: 2,
                        ...Typography.preset.bodySmall,
                        color: Colors.text.secondary,
                      }}
                    >
                      {b.desc}
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
                  title="Family 연간"
                  price={`${familyYearly.toLocaleString()}원/년`}
                  meta={`월 ${familyYearlyPerMonth.toLocaleString()}원 · ${familySavingsPercent}% 할인 · 전부 무제한`}
                  badge="추천"
                />
              ) : null}
              <PlanOption
                selected={plan === 'familyMonthly'}
                onPress={() => setPlan('familyMonthly')}
                title="Family 월간"
                price={`${familyMonthly.toLocaleString()}원/월`}
                meta={familyMonthlyIntro
                  ? `첫 달 ${familyMonthlyIntro.toLocaleString()}원 · 전부 무제한 · 언제든 해지`
                  : '전부 무제한 · 언제든 해지'}
                badge={familyMonthlyIntro ? `첫 달 ${familyMonthlyIntro.toLocaleString()}원` : (Config.showFamilyYearly ? undefined : '추천')}
              />
              <PlanOption
                selected={plan === 'friendMonthly'}
                onPress={() => setPlan('friendMonthly')}
                title="Friend 월간"
                price={`${friendMonthly.toLocaleString()}원/월`}
                meta="기본기 위주 · 가볍게 시작"
              />
            </View>

            {premiumModalFirstHit ? (
              <>
                <Button variant="primary" fullWidth size="lg" onPress={hidePremiumModal}>
                  계속 무료로 쓸게요
                </Button>
                <View style={{ height: Spacing.sm }} />
                <Button variant="ghost" fullWidth onPress={handlePurchase} loading={purchasing}>
                  {planLabel(plan)} 시작하기
                </Button>
              </>
            ) : (
              <>
                <Button variant="primary" fullWidth size="lg" onPress={handlePurchase} loading={purchasing}>
                  {planLabel(plan)} 시작하기
                </Button>
                <View style={{ height: Spacing.sm }} />
                <Button variant="ghost" fullWidth onPress={hidePremiumModal}>
                  나중에
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
              구독은 App Store / Google Play에서 관리할 수 있어요
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

function planLabel(plan: Plan): string {
  switch (plan) {
    case 'friendMonthly': return 'Friend 월간';
    case 'familyMonthly': return 'Family 월간';
    case 'familyYearly': return 'Family 연간';
  }
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
