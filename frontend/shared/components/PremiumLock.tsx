import { Pressable, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../hooks/useTheme';
import { useUiStore } from '../store/uiStore';

interface PremiumLockProps {
  /** 사이즈. sm=20px(아이콘만), md=80px(라벨 포함). 기본 sm. */
  size?: 'sm' | 'md';
  /** "프리미엄" 라벨 표시. md 면 기본 true, sm 이면 기본 false. */
  showLabel?: boolean;
  /** 탭 시 PremiumModal 노출. 기본 true. */
  pressable?: boolean;
  /** PremiumModal 에 표시할 안내 메시지. */
  message?: string;
  /** 절대 배치용 추가 스타일 (코너 등). */
  style?: ViewStyle;
}

/**
 * 프리미엄 잠금 시각 표지. 라벤더 배경 + 자물쇠 아이콘.
 * - 기능 자체는 PremiumModal 호출이 처리 — 이 컴포넌트는 "유료 기능" 임을 시각적으로 알리는 기표(signifier).
 * - 카드/토글/슬롯 모서리에 절대 배치하거나, 인라인으로 라벨과 함께 사용.
 */
export default function PremiumLock({
  size = 'sm',
  showLabel,
  pressable = true,
  message,
  style,
}: PremiumLockProps) {
  const Colors = useColors();
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);
  const finalShowLabel = showLabel ?? size === 'md';

  const dim = size === 'sm' ? 20 : 24;
  const iconSize = size === 'sm' ? 10 : 12;

  const content = (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          height: dim,
          paddingHorizontal: finalShowLabel ? Spacing.sm : 0,
          width: finalShowLabel ? undefined : dim,
          justifyContent: 'center',
          borderRadius: dim / 2,
          backgroundColor: Colors.premium,
        },
        style,
      ]}
    >
      <Feather name="lock" size={iconSize} color={Colors.white} />
      {finalShowLabel ? (
        <Text
          style={{
            fontSize: Typography.size.xxs,
            color: Colors.white,
            fontWeight: Typography.weight.bold,
            letterSpacing: Typography.letterSpacing.wide,
          }}
        >
          프리미엄
        </Text>
      ) : null}
    </View>
  );

  if (!pressable) return content;
  return (
    <Pressable
      onPress={() => showPremiumModal(message ?? '프리미엄 구독으로 한도를 풀 수 있어요')}
      hitSlop={Spacing.hitSlop}
    >
      {content}
    </Pressable>
  );
}
