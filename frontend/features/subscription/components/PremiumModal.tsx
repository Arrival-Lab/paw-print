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
import { useBottomSheetSafePadding } from '../../../shared/hooks/useBottomSheetSafePadding';

// FRIEND/FAMILY 공통 혜택 — 두 플랜 모두 무제한인 항목만. OCR·AI 는 차등이라 제외.
const BENEFITS: { icon: React.ComponentProps<typeof Feather>['name']; title: string; desc: string }[] = [
  { icon: 'camera', title: '사진 첨부 무제한', desc: '진료기록·다이어리당 사진 제한 없이 보관' },
  { icon: 'trending-up', title: '전체 기간 그래프', desc: '체중·식사·증상 추이를 한눈에' },
  { icon: 'bell', title: '예방접종·정기 케어 알림 무제한', desc: '벼룩약·심장사상충 약까지 D-day 알림' },
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
