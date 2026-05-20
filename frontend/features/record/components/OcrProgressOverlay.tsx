import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors, useTheme } from '../../../shared/hooks/useTheme';

/**
 * OCR 진행 단계 UI.
 * Gemini Vision 은 단일 요청으로 결과를 반환하므로 실제 stage 이벤트는 없다.
 * 그래서 사용자 인지 부담을 줄이려고 예상 시간(약 4초) 동안 단계가 순차로 체크되는 것처럼 가짜 진행.
 * isComplete=true 가 들어오면 즉시 마지막 단계까지 점프.
 */
const STAGES = [
  { icon: 'image' as const, label: '사진 분석', detail: '이미지를 살펴보고 있어요' },
  { icon: 'type' as const, label: '텍스트 추출', detail: '글자를 한 줄씩 읽고 있어요' },
  { icon: 'layout' as const, label: '필드 매칭', detail: '병원·날짜·금액을 찾고 있어요' },
];

interface Props {
  visible: boolean;
  /** OCR mutation 완료. true 면 마지막 단계 즉시 활성화 후 dismiss. */
  isComplete?: boolean;
}

export default function OcrProgressOverlay({ visible, isComplete = false }: Props) {
  const Colors = useColors();
  const { isDark } = useTheme();
  const [stageIdx, setStageIdx] = useState(0);

  // 단계 자동 진행 — 1.4초마다 다음. 마지막 단계에서는 멈춤.
  useEffect(() => {
    if (!visible) {
      setStageIdx(0);
      return;
    }
    if (isComplete) {
      setStageIdx(STAGES.length - 1);
      return;
    }
    if (stageIdx >= STAGES.length - 1) return;
    const t = setTimeout(() => setStageIdx((i) => Math.min(i + 1, STAGES.length - 1)), 1400);
    return () => clearTimeout(t);
  }, [visible, stageIdx, isComplete]);

  if (!visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
      }}
    >
      <BlurView
        intensity={35}
        tint={isDark ? 'dark' : 'light'}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={[StyleSheet.absoluteFill, { backgroundColor: Colors.glass.overlay }]}
      />
      <View
        style={{
          width: '100%',
          maxWidth: 360,
          borderRadius: Spacing.borderRadius.xl,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: Colors.glass.border,
        }}
      >
        <BlurView
          intensity={50}
          tint={isDark ? 'dark' : 'light'}
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ backgroundColor: Colors.glass.surfaceStrong, padding: Spacing.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.lg }}>
          <Feather name="zap" size={14} color={Colors.primaryDark} />
          <Text style={{ ...Typography.preset.caption, color: Colors.primaryDark, fontWeight: Typography.weight.bold }}>
            AI 자동 입력
          </Text>
        </View>
        <Text style={{ ...Typography.preset.heading, color: Colors.text.primary, fontWeight: Typography.weight.bold, marginBottom: Spacing.lg }}>
          처방전을 읽고 있어요
        </Text>
        {STAGES.map((stage, i) => {
          const done = i < stageIdx;
          const active = i === stageIdx;
          return (
            <Stage
              key={stage.label}
              icon={stage.icon}
              label={stage.label}
              detail={stage.detail}
              done={done}
              active={active}
              showConnector={i < STAGES.length - 1}
              colors={Colors}
            />
          );
        })}
        </View>
      </View>
    </View>
  );
}

interface StageProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  detail: string;
  done: boolean;
  active: boolean;
  showConnector: boolean;
  colors: ReturnType<typeof useColors>;
}

function Stage({ icon, label, detail, done, active, showConnector, colors }: StageProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(0);
    }
  }, [active, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  const iconBg = done ? colors.status.success : active ? colors.primaryDark : colors.surface;
  const iconColor = done || active ? colors.white : colors.text.tertiary;
  const labelColor = done ? colors.text.primary : active ? colors.text.primary : colors.text.tertiary;
  const detailColor = active ? colors.text.secondary : colors.text.tertiary;

  return (
    <View style={{ flexDirection: 'row', gap: Spacing.md }}>
      <View style={{ alignItems: 'center', width: 32 }}>
        <Animated.View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: iconBg,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale }],
            borderWidth: done || active ? 0 : 1,
            borderColor: colors.border,
          }}
        >
          <Feather name={done ? 'check' : icon} size={14} color={iconColor} />
        </Animated.View>
        {showConnector ? (
          <View
            style={{
              width: 2,
              flex: 1,
              backgroundColor: done ? colors.status.success : colors.border,
              marginVertical: 2,
            }}
          />
        ) : null}
      </View>
      <View style={{ flex: 1, paddingBottom: showConnector ? Spacing.md : 0 }}>
        <Text
          style={{
            ...Typography.preset.bodyMedium,
            fontWeight: Typography.weight.semibold,
            color: labelColor,
          }}
        >
          {label}
        </Text>
        <Text style={{ ...Typography.preset.caption, color: detailColor, marginTop: 2 }}>
          {detail}
        </Text>
      </View>
    </View>
  );
}
