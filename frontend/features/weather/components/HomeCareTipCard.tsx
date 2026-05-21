import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography, Elevation } from '../../../constants';
import { TRIGGER_THEMES, buildChips } from '../theme';
import type { WeatherTrigger, WeatherSnapshot } from '../types';

interface Props {
  trigger: WeatherTrigger;
  headerLabel: string;            // "호우 주의" or "X월의 케어 팁"
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  body: string;
  caution?: string;               // weather 팁만 가짐
  weather: WeatherSnapshot | null;
  onPress?: () => void;           // NONE 일 때만 — 월별 가이드 모달 오픈
}

/**
 * 홈 상단 케어 팁 카드.
 * - 트리거별 단색 배경 (theme.ts 의 gradient[0] = light tone 사용)
 * - 좌측 accent 동그라미로 트리거 색 구분
 * - 트리거 활성 시: 날씨 데이터 칩 + ⚠ caution
 * - NONE: "모든 안내 보기 →" 링크 + 탭 가능
 */
export default function HomeCareTipCard({
  trigger,
  headerLabel,
  icon,
  title,
  body,
  caution,
  weather,
  onPress,
}: Props) {
  const theme = TRIGGER_THEMES[trigger];
  const chips = buildChips(trigger, weather);
  const isMonthly = trigger === 'NONE';

  const inkPrimary   = '#2D2622';    // 어두운 ink (그라데이션 위 본문)
  const inkSecondary = '#5C544D';
  const inkOnAccent  = theme.textOnAccent;

  const content = (
    <View
      style={{
        borderRadius: Spacing.borderRadius.xl,
        padding: Spacing.lg,
        gap: Spacing.md,
        backgroundColor: theme.gradient[0],
        ...Elevation.card,
      }}
    >
      {/* 1행: 아이콘 + 헤더 라벨 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
        {isMonthly ? (
          <Image
            source={require('../../../assets/heart.png')}
            style={{ width: 44, height: 44 }}
            resizeMode="contain"
          />
        ) : (
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name={icon} size={22} color={inkOnAccent} />
          </View>
        )}
        <Text
          style={{
            ...Typography.preset.caption,
            color: theme.accent,
            fontWeight: Typography.weight.bold,
            letterSpacing: Typography.letterSpacing.wide,
            textTransform: 'uppercase',
          }}
        >
          {headerLabel}
        </Text>
      </View>

      {/* 2행: 제목 */}
      <Text
        style={{
          ...Typography.preset.title,
          color: inkPrimary,
          fontWeight: Typography.weight.bold,
        }}
      >
        {title}
      </Text>

      {/* 3행: 본문 */}
      <Text
        style={{
          ...Typography.preset.body,
          color: inkSecondary,
          lineHeight: Typography.size.md * Typography.lineHeight.relaxed,
        }}
      >
        {body}
      </Text>

      {/* 4행: 데이터 칩 (트리거 활성 + 데이터 있을 때만) */}
      {chips.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
          {chips.map((chip, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: Spacing.sm,
                paddingVertical: 4,
                borderRadius: Spacing.borderRadius.full,
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              <Text style={{ fontSize: Typography.size.xs }}>{chip.icon}</Text>
              <Text
                style={{
                  ...Typography.preset.caption,
                  color: inkPrimary,
                  fontWeight: Typography.weight.semibold,
                }}
              >
                {chip.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* 5행: caution (날씨 팁) or "모든 안내 보기" (월별) */}
      {caution ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 6,
            paddingTop: Spacing.xs,
            borderTopWidth: 1,
            borderTopColor: 'rgba(0, 0, 0, 0.08)',
          }}
        >
          <Feather name="alert-circle" size={13} color={theme.accent} style={{ marginTop: 2 }} />
          <Text
            style={{
              ...Typography.preset.caption,
              color: inkSecondary,
              flex: 1,
              lineHeight: Typography.size.xs * Typography.lineHeight.relaxed,
            }}
          >
            {caution}
          </Text>
        </View>
      ) : isMonthly ? (
        <Text
          style={{
            ...Typography.preset.caption,
            color: theme.accent,
            fontWeight: Typography.weight.bold,
          }}
        >
          모든 안내 보기 →
        </Text>
      ) : null}
    </View>
  );

  if (isMonthly && onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}
