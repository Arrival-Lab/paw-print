import { useState } from 'react';
import { Modal, View, Text, Pressable, Dimensions, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { createMMKV } from 'react-native-mmkv';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import Button from '../../../shared/components/Button';

const storage = createMMKV({ id: 'pawprint-onboarding' });
const TOUR_KEY = 'app-tour-shown';

const { width: SW, height: SH } = Dimensions.get('window');

/**
 * 앱 첫 진입 가이드 투어. fullscreen 어두운 overlay + 단계별 핑크 풍선.
 * 좌표는 화면 비율로 추정 (헤더/탭바/FAB 의 표준 위치).
 * dismiss 시 MMKV 영속. 다시 보고 싶으면 mypage 의 "가이드 다시 보기" (TODO).
 */
const STEPS = [
  {
    icon: 'plus-square' as const,
    title: '응급할 땐 우측 상단 빨간 + 아이콘',
    body: '내 위치 기준 가까운 24시 동물병원을 1탭으로 찾을 수 있어요. 야간엔 자동으로 강조돼요.',
    // 화면 우측 상단 영역 (헤더 EmergencyAction)
    spotlight: { top: Platform.OS === 'ios' ? 56 : 24, right: 12, width: 44, height: 44 },
    arrow: 'top-right' as const,
  },
  {
    icon: 'home' as const,
    title: '중앙 큰 버튼이 홈',
    body: '오늘 챙길 것, 다가오는 일정, 이번 주 활동이 한 화면에 모여있어요.',
    spotlight: { bottom: Platform.OS === 'ios' ? 60 : 40, left: SW / 2 - 34, width: 68, height: 68 },
    arrow: 'bottom-center' as const,
  },
  {
    icon: 'plus' as const,
    title: '우하단 + 버튼으로 빠른 추가',
    body: '다이어리·진료기록·병원 예약·예방접종 등 자주 쓰는 흐름을 한 번에 띄워줘요.',
    spotlight: { bottom: Platform.OS === 'ios' ? 130 : 110, right: 16, width: 56, height: 56 },
    arrow: 'bottom-right' as const,
  },
];

export function useAppTour() {
  const [visible, setVisible] = useState(() => !storage.getBoolean(TOUR_KEY));
  const dismiss = () => {
    storage.set(TOUR_KEY, true);
    setVisible(false);
  };
  return { visible, dismiss };
}

export default function AppTourOverlay() {
  const Colors = useColors();
  const { visible, dismiss } = useAppTour();
  const [stepIdx, setStepIdx] = useState(0);
  if (!visible) return null;

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) dismiss();
    else setStepIdx((i) => i + 1);
  };

  // 풍선 위치 — spotlight 아래/위/옆 적당히
  const bubbleStyle: any = (() => {
    if (step.arrow === 'top-right') {
      return { top: (step.spotlight.top ?? 0) + (step.spotlight.height ?? 0) + 12, right: 12, left: 12 };
    }
    if (step.arrow === 'bottom-center') {
      return { bottom: (step.spotlight.bottom ?? 0) + (step.spotlight.height ?? 0) + 16, left: 16, right: 16 };
    }
    return { bottom: (step.spotlight.bottom ?? 0) + (step.spotlight.height ?? 0) + 16, left: 16, right: 16 };
  })();

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
        {/* spotlight — 강조 영역 (어두운 overlay 위로 핑크 보더) */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: step.spotlight.top,
            bottom: step.spotlight.bottom,
            left: step.spotlight.left,
            right: step.spotlight.right,
            width: step.spotlight.width,
            height: step.spotlight.height,
            borderRadius: Math.min(step.spotlight.width, step.spotlight.height) / 2,
            borderWidth: 3,
            borderColor: Colors.primary,
            shadowColor: Colors.primary,
            shadowOpacity: 0.6,
            shadowRadius: 12,
          }}
        />

        {/* 풍선 카드 */}
        <View
          style={{
            position: 'absolute',
            ...bubbleStyle,
            backgroundColor: Colors.surfaceElevated,
            borderRadius: Spacing.borderRadius.xl,
            padding: Spacing.lg,
            gap: Spacing.sm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: Colors.primaryLight,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Feather name={step.icon} size={14} color={Colors.primaryDark} />
            </View>
            <Text style={{ ...Typography.preset.caption, color: Colors.primaryDark, fontWeight: Typography.weight.bold }}>
              {stepIdx + 1} / {STEPS.length}
            </Text>
          </View>
          <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary, fontWeight: Typography.weight.bold }}>
            {step.title}
          </Text>
          <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary }}>
            {step.body}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm }}>
            <Pressable onPress={dismiss} hitSlop={Spacing.hitSlop}>
              <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                건너뛰기
              </Text>
            </Pressable>
            <Button onPress={handleNext} variant="primary" size="sm">
              {isLast ? '시작하기' : '다음'}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
