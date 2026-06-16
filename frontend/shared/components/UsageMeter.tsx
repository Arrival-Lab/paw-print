import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../hooks/useTheme';

interface UsageMeterProps {
  /** 사용한 횟수. */
  current: number;
  /** 무료 한도. */
  max: number;
  /** 메터 좌측 라벨 (예: "OCR 자동입력 · 이번 달"). */
  label: string;
  /** 단위 라벨 (예: "회"). 기본값 빈 문자열. */
  unit?: string;
  /** 좌측 아이콘. 기본값 zap. */
  icon?: React.ComponentProps<typeof Feather>['name'];
  /** 진행바 표시 여부. compact 모드는 false. */
  showBar?: boolean;
}

/**
 * 무료 한도 사용량 표시. 한계 직전(80%+) 이면 warning 톤, 도달하면 error 톤.
 * 진행률 한 줄로 사용자가 "내가 몇 번 더 쓸 수 있는지" 를 명시적으로 인지.
 */
export default function UsageMeter({
  current,
  max,
  label,
  unit = '',
  icon = 'zap',
  showBar = true,
}: UsageMeterProps) {
  const Colors = useColors();
  const { t } = useTranslation();
  const remaining = Math.max(max - current, 0);
  const pct = max === 0 ? 0 : Math.min(100, Math.round((current / max) * 100));
  const tone: 'normal' | 'warning' | 'error' =
    remaining === 0 ? 'error' : pct >= 80 ? 'warning' : 'normal';

  const accent =
    tone === 'error' ? Colors.status.error
    : tone === 'warning' ? Colors.status.warning
    : Colors.primaryDark;
  const bg =
    tone === 'error' ? Colors.status.errorBg
    : tone === 'warning' ? Colors.status.warningBg
    : Colors.primaryLight;

  const remainingLabel =
    remaining === 0
      ? t('subscription.usageExhausted')
      : remaining === 1
        ? t('subscription.usageLastOne', { unit })
        : t('subscription.usageRemaining', { count: remaining, unit });

  return (
    <View
      style={{
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Spacing.borderRadius.md,
        backgroundColor: bg,
        gap: showBar ? 6 : 0,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
        <Feather name={icon} size={12} color={accent} />
        <Text style={{ ...Typography.preset.caption, color: accent, fontWeight: Typography.weight.semibold, flex: 1 }}>
          {label}
        </Text>
        <Text style={{ ...Typography.preset.caption, color: accent, fontWeight: Typography.weight.bold }}>
          {current}/{max}{unit}
        </Text>
      </View>
      {showBar ? (
        <View
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: 'rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >
          <View style={{ width: `${pct}%`, height: '100%', backgroundColor: accent }} />
        </View>
      ) : null}
      <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, fontSize: Typography.size.xxs }}>
        {remainingLabel}
      </Text>
    </View>
  );
}
