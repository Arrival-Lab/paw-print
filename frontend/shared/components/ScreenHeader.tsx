import { Image, Pressable, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../hooks/useTheme';
import TourTarget from './TourTarget';
import { TOUR_TARGETS } from '../store/tourStore';

export interface ActionItem {
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  label?: string;
}

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean | (() => void);
  actions?: ActionItem[];
  variant?: 'default' | 'large' | 'transparent';
  style?: ViewStyle;
  /** true 면 응급병원 우상단 글로벌 액션을 숨김 (글쓰기 modal·더보기 본인 화면 등). */
  hideEmergency?: boolean;
  /** @deprecated 마이페이지는 탭(더보기)으로 통합됨. 호환을 위해 prop 만 유지. */
  hideMypage?: boolean;
  /** 헤더 본문 아래에 렌더링되는 컨텍스트 영역 — PetSelector 등 펫 컨텍스트가 화면 단위로 공통일 때 사용. */
  children?: React.ReactNode;
  /**
   * 타이틀 옆에 inline 노출되는 슬롯 — 보통 <PetContextBadge ... /> 같은 feature-specific 칩.
   * ScreenHeader 자체는 어떤 칩인지 모름 (DIP: shared 컴포넌트가 features 모듈에 의존하지 않도록).
   */
  titleSlot?: React.ReactNode;
}

export default function ScreenHeader({
  title,
  subtitle,
  back = false,
  actions,
  variant = 'default',
  style,
  hideEmergency = false,
  children,
  titleSlot,
}: ScreenHeaderProps) {
  const Colors = useColors();
  const handleBack = () => {
    if (typeof back === 'function') {
      back();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    }
  };

  const isLarge = variant === 'large';
  // 헤더 배경 = 본문 surface 와 동일하게 → 경계 보이지 않도록 통합감.
  const bg = variant === 'transparent' ? 'transparent' : Colors.surface;

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.sm,
          paddingBottom: isLarge ? Spacing.md : Spacing.sm,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44 }}>
        {back ? (
          <Pressable
            onPress={handleBack}
            hitSlop={Spacing.hitSlop}
            style={{
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: Spacing.xs,
              marginLeft: -Spacing.sm,
            }}
          >
            <Feather name="chevron-left" size={26} color={Colors.text.primary} />
          </Pressable>
        ) : (
          // 탑레벨 화면 (back 없음) — 좌측에 앱 아이콘 브랜드 마크 (foreground paw)
          <Image
            source={require('../../assets/adaptive-icon.png')}
            style={{ width: 28, height: 28, marginRight: Spacing.sm, marginLeft: -2 }}
            resizeMode="contain"
          />
        )}

        {!isLarge && (
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' }}>
              <Text numberOfLines={1} style={{ ...Typography.preset.title, color: Colors.text.primary, flexShrink: 1 }}>
                {title}
              </Text>
              {titleSlot}
            </View>
            {subtitle ? (
              <Text
                numberOfLines={1}
                style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        )}

        {isLarge && <View style={{ flex: 1 }} />}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
          {actions?.map((a, i) => (
            <Pressable
              key={`${a.icon}-${i}`}
              onPress={a.onPress}
              hitSlop={Spacing.hitSlop}
              accessibilityLabel={a.label}
              style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
            >
              <Feather name={a.icon} size={20} color={Colors.text.primary} />
            </Pressable>
          ))}
          {!hideEmergency ? <EmergencyAction /> : null}
        </View>
      </View>

      {isLarge ? (
        <View style={{ marginTop: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' }}>
            <Text style={{ ...Typography.preset.h1, color: Colors.text.primary }}>{title}</Text>
            {titleSlot}
          </View>
          {subtitle ? (
            <Text style={{ marginTop: 4, ...Typography.preset.body, color: Colors.text.secondary }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}

      {children ? <View style={{ marginTop: Spacing.xs }}>{children}</View> : null}
    </View>
  );
}

// 평상시: 작은 아이콘만 (브랜드 톤). 심야 (22~06시): 옅은 핑크 chip + 라벨 — 응급 컨텍스트만 살리고 시각적 긴장감은 제거.
// "병원"은 의료앱의 일상 기능이지 사고/경고가 아니므로 status.error 빨강 사용 금지.
function EmergencyAction() {
  const Colors = useColors();
  const hour = new Date().getHours();
  const isLateNight = hour >= 22 || hour < 6;

  if (isLateNight) {
    return (
      <TourTarget tourId={TOUR_TARGETS.EMERGENCY}>
        <Pressable
          onPress={() => router.push('/hospital')}
          hitSlop={Spacing.hitSlop}
          accessibilityLabel="응급/24시 동물병원 찾기"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: Spacing.borderRadius.full,
            backgroundColor: Colors.primaryLight,
          }}
        >
          <Feather name="plus-square" size={14} color={Colors.primaryDark} />
          <Text
            style={{
              ...Typography.preset.caption,
              color: Colors.primaryDark,
              fontWeight: Typography.weight.semibold,
            }}
          >
            24시 병원
          </Text>
        </Pressable>
      </TourTarget>
    );
  }

  // 평상시에도 라벨 노출 — 아이콘만 있으면 사용자가 "추가" 버튼으로 오인함(테스트 피드백).
  // 핑크 칩은 심야 응급 컨텍스트에만 쓰고, 평상시는 옅은 outline pill 로 강조 톤 분리.
  return (
    <TourTarget tourId={TOUR_TARGETS.EMERGENCY}>
      <Pressable
        onPress={() => router.push('/hospital')}
        hitSlop={Spacing.hitSlop}
        accessibilityLabel="동물병원 찾기"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: Spacing.borderRadius.full,
          borderWidth: 1,
          borderColor: Colors.border,
        }}
      >
        <Feather name="plus-square" size={14} color={Colors.text.secondary} />
        <Text
          style={{
            ...Typography.preset.caption,
            color: Colors.text.secondary,
            fontWeight: Typography.weight.semibold,
          }}
        >
          병원
        </Text>
      </Pressable>
    </TourTarget>
  );
}
