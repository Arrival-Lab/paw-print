import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { Typography } from '../../constants';
import { useColors } from '../hooks/useTheme';

type Tone =
  | 'primary'      // 본문 메인 (text.primary)
  | 'secondary'    // 보조 (text.secondary)
  | 'tertiary'     // 메타 (text.tertiary)
  | 'inverse'      // 컬러 배경 위 흰 텍스트
  | 'accent'       // 액센트 컬러
  | 'error'        // 에러
  | 'success';     // 성공

type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

interface BaseProps extends RNTextProps {
  tone?: Tone;
  weight?: Weight;
  align?: TextStyle['textAlign'];
  /** 인라인 색상 직접 지정 (tone 보다 우선). 가급적 tone 사용. */
  color?: string;
}

function useToneColor(tone: Tone): string {
  const Colors = useColors();
  switch (tone) {
    case 'secondary': return Colors.text.secondary;
    case 'tertiary': return Colors.text.tertiary;
    case 'inverse': return Colors.text.inverse;
    case 'accent': return Colors.text.accent;
    case 'error': return Colors.status.error;
    case 'success': return Colors.status.success;
    case 'primary':
    default:
      return Colors.text.primary;
  }
}

function buildStyle(
  preset: 'heading' | 'body' | 'caption',
  tone: Tone,
  weight: Weight | undefined,
  color: string | undefined,
  toneColor: string,
  align: TextStyle['textAlign'] | undefined,
): TextStyle {
  return {
    ...Typography.preset[preset],
    color: color ?? toneColor,
    ...(weight ? { fontWeight: Typography.weight[weight] } : null),
    ...(align ? { textAlign: align } : null),
  };
}

/** 17pt — 섹션 제목·강조 텍스트·강조 숫자. */
export function Heading({ tone = 'primary', weight, align, color, style, ...rest }: BaseProps) {
  const toneColor = useToneColor(tone);
  return (
    <RNText
      style={[buildStyle('heading', tone, weight, color, toneColor, align), style]}
      {...rest}
    />
  );
}

/** 15pt — 본문·카드 제목·라벨. */
export function Body({ tone = 'primary', weight, align, color, style, ...rest }: BaseProps) {
  const toneColor = useToneColor(tone);
  return (
    <RNText
      style={[buildStyle('body', tone, weight, color, toneColor, align), style]}
      {...rest}
    />
  );
}

/** 13pt — 메타·부제·캡션. */
export function Caption({ tone = 'tertiary', weight, align, color, style, ...rest }: BaseProps) {
  const toneColor = useToneColor(tone);
  return (
    <RNText
      style={[buildStyle('caption', tone, weight, color, toneColor, align), style]}
      {...rest}
    />
  );
}
