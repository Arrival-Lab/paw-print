import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useUiStore } from '../store/uiStore';
import { Config, Elevation, Spacing, Typography } from '../../constants';
import { useColors } from '../hooks/useTheme';
import Button from './Button';

type Plan = 'monthly' | 'yearly';

const BENEFITS: { icon: React.ComponentProps<typeof Feather>['name']; title: string; desc: string }[] = [
  { icon: 'heart', title: '반려동물 무제한', desc: '여러 마리도 한 곳에서 안전하게 관리' },
  { icon: 'camera', title: '사진 첨부 무제한', desc: '진료기록당 사진 제한 없이 보관' },
  { icon: 'cpu', title: 'OCR 무제한', desc: '진료비 영수증을 자동으로 정리' },
  { icon: 'trending-up', title: '전체 기간 그래프', desc: '체중·식사·증상 추이를 한눈에' },
  { icon: 'bell', title: '예방접종 알림 무제한', desc: '백신 일정을 놓치지 않도록' },
  { icon: 'users', title: '가족·친구 공유 무제한', desc: '여러 명이 함께 케어' },
];

export default function PremiumModal() {
  const { isPremiumModalVisible, premiumModalMessage, hidePremiumModal } = useUiStore();
  const [plan, setPlan] = useState<Plan>('yearly');
  const Colors = useColors();

  const monthly = Config.premiumPriceMonthly;
  const yearly = Config.premiumPriceYearly;
  const yearlyPerMonth = Math.round(yearly / 12);
  const savingsPercent = Math.round(((monthly * 12 - yearly) / (monthly * 12)) * 100);

  return (
    <Modal
      visible={isPremiumModalVisible}
      transparent
      animationType="fade"
      onRequestClose={hidePremiumModal}
      statusBarTranslucent
    >
      <View style={{ flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: Colors.white,
            borderTopLeftRadius: Spacing.borderRadius.xxl,
            borderTopRightRadius: Spacing.borderRadius.xxl,
            paddingTop: Spacing.md,
            paddingBottom: Spacing.xxxl,
            maxHeight: '92%',
            ...Elevation.modal,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 40,
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
                프리미엄으로 더 가까이
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
              <PlanOption
                selected={plan === 'yearly'}
                onPress={() => setPlan('yearly')}
                title="연간 구독"
                price={`${yearly.toLocaleString()}원/년`}
                meta={`월 ${yearlyPerMonth.toLocaleString()}원 · ${savingsPercent}% 할인`}
                badge="추천"
              />
              <PlanOption
                selected={plan === 'monthly'}
                onPress={() => setPlan('monthly')}
                title="월간 구독"
                price={`${monthly.toLocaleString()}원/월`}
                meta="언제든지 해지 가능"
              />
            </View>

            <Button variant="primary" fullWidth size="lg" onPress={hidePremiumModal}>
              {plan === 'yearly' ? '연간 시작하기' : '월간 시작하기'}
            </Button>
            <View style={{ height: Spacing.sm }} />
            <Button variant="ghost" fullWidth onPress={hidePremiumModal}>
              나중에
            </Button>

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
      </View>
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
