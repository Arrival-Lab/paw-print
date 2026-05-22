import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
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
  const Colors = useColors();
  const theme = TRIGGER_THEMES[trigger];
  const chips = buildChips(trigger, weather);
  const isMonthly = trigger === 'NONE';

  // 카드 배경은 중립 surface 톤으로 통일 — '여러 색이 정신 없다' 피드백 반영.
  // trigger 별 색은 좌측 아이콘 원 + 우측 데이터 칩에서만 시그널.
  const inkPrimary   = Colors.text.primary;
  const inkSecondary = Colors.text.secondary;
  const inkOnAccent  = theme.textOnAccent;

  const content = (
    <View
      style={{
        borderRadius: Spacing.borderRadius.xl,
        padding: Spacing.lg,
        gap: Spacing.xs,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
      }}
    >
      {/* trigger 활성 시에만 헤더 라벨 row. NONE(평상시)엔 라벨 없이 제목부터. */}
      {!isMonthly ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xs }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: theme.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name={icon} size={16} color={inkOnAccent} />
          </View>
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
          {chips.length > 0 ? (
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
                gap: Spacing.xs,
              }}
            >
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
                    backgroundColor: Colors.surfaceElevated,
                    borderWidth: 1,
                    borderColor: Colors.border,
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
        </View>
      ) : null}

      {/* 제목 — NONE 일 땐 좌측에 작은 heart inline */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
        {isMonthly ? (
          <Image
            source={require('../../../assets/heart.png')}
            style={{ width: 22, height: 22 }}
            resizeMode="contain"
          />
        ) : null}
        <Text
          style={{
            ...Typography.preset.title,
            color: inkPrimary,
            fontWeight: Typography.weight.bold,
            flex: 1,
          }}
        >
          {title}
        </Text>
      </View>

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
