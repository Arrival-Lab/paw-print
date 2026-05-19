import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Typography } from '../../constants';
import { useColors } from '../hooks/useTheme';

interface Props {
  /** 외경 (pt). 기본 56. */
  size?: number;
  /** 링 두께. 기본 5. */
  strokeWidth?: number;
  completed: number;
  total: number;
  /** 내부에 "n/m" 표시. 기본 true. */
  showLabel?: boolean;
}

/**
 * 원형 진행률 링. total=0 이면 빈 링. completed>=total 이면 success 컬러로 완료 표시.
 */
export default function CircularProgress({
  size = 56,
  strokeWidth = 5,
  completed,
  total,
  showLabel = true,
}: Props) {
  const Colors = useColors();
  const safe = Math.max(0, total);
  const progress = safe === 0 ? 0 : Math.min(1, completed / safe);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const isDone = safe > 0 && completed >= safe;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDone ? Colors.status.success : Colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {showLabel ? (
        <Text
          style={{
            ...Typography.preset.caption,
            fontWeight: Typography.weight.bold,
            color: Colors.text.primary,
          }}
        >
          {completed}/{safe}
        </Text>
      ) : null}
    </View>
  );
}
