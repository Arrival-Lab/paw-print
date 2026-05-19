import { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { createMMKV } from 'react-native-mmkv';
import { router } from 'expo-router';
import Svg, { Defs, Mask, RadialGradient, Rect, Stop, Filter, FeGaussianBlur } from 'react-native-svg';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import Button from '../../../shared/components/Button';
import { useTourStore, TOUR_TARGETS, type TourTargetRect } from '../tourStore';

const storage = createMMKV({ id: 'pawprint-onboarding' });
const TOUR_KEY = 'app-tour-shown-v2';

const { width: SW, height: SH } = Dimensions.get('window');
const OVERLAY = 'rgba(15, 23, 42, 0.78)';

interface Step {
  /** 비우면 spotlight 없이 안내 카드만 표시 — 화면 영역이 크거나 시인성 우선 시. */
  targetId?: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  body: string;
  shape?: 'circle' | 'cutout';
  /** 이 step 진입 시 자동 이동할 라우트. */
  route?: string;
  /** target 없을 때 카드 절대 위치 — 화면 비율 기준. 미지정 시 가운데 default. */
  cardLayout?: { topR: number; leftR: number; widthR: number };
}

const HOME_ROUTE = '/(tabs)';

const STEPS: Step[] = [
  { targetId: TOUR_TARGETS.EMERGENCY, icon: 'plus-square', title: '응급 동물병원',
    body: '가까운 동물병원을 찾을 수 있어요. 야간엔 24시 동물병원이 표시돼요.', shape: 'circle', route: HOME_ROUTE },
  { targetId: TOUR_TARGETS.HOME_FILTER, icon: 'user', title: '펫 필터',
    body: '필요에 따라 원하는 반려동물의 홈을 골라 볼 수 있어요.', shape: 'circle', route: HOME_ROUTE },
  { targetId: TOUR_TARGETS.HOME_PET_GROUP, icon: 'heart', title: '오늘 펫 한눈에',
    body: '이름·나이·체중·알러지에 오늘 케어 진행률까지 한 카드에. 사진/이름 누르면 상세화면, 원형 진행률 누르면 케어 체크 화면.', shape: 'cutout', route: HOME_ROUTE },
  { targetId: TOUR_TARGETS.HOME_UPCOMING, icon: 'calendar', title: '다가오는 일정',
    body: '예약된 진료가 며칠 남았는지 D-day 로 보여줘요.', shape: 'cutout', route: HOME_ROUTE },
  { targetId: TOUR_TARGETS.FAB, icon: 'plus', title: '+ 버튼으로 빠른 추가',
    body: '다이어리·진료기록·병원 예약·예방접종 등 등록해야 할 것을 빠르게 추가할 수 있어요.', shape: 'circle', route: HOME_ROUTE },
  { icon: 'calendar', title: '다이어리',
    body: '월별 캘린더로 반려동물과의 하루를 기록하고 진료·일정도 한 화면에서 확인해요.', route: '/(tabs)/diary',
    cardLayout: { topR: 0.10, leftR: 0.35, widthR: 0.62 } },
  { icon: 'book-open', title: '기록',
    body: '진료 예약·기록, 예방접종, 영양제 및 처방약 등 각종 케어 정보를 기록할 수 있어요.', route: '/(tabs)/records',
    cardLayout: { topR: 0.22, leftR: 0.17, widthR: 0.66 } },
  { icon: 'message-circle', title: '커뮤니티',
    body: '같은 고민을 가진 보호자들과 정보, 후기, 증상을 나눠요.', route: '/(tabs)/community',
    cardLayout: { topR: 0.18, leftR: 0.17, widthR: 0.66 } },
  { icon: 'menu', title: '더보기',
    body: '반려동물 관리, 공유, 테마, 구독 등 모든 설정과 빠른 진입이 가능해요.', route: '/(tabs)/mypage',
    cardLayout: { topR: 0.015, leftR: 0.34, widthR: 0.63 } },
];

export function useAppTour() {
  const [visible, setVisible] = useState(() => !storage.getBoolean(TOUR_KEY));
  const close = () => setVisible(false);
  const neverShowAgain = () => {
    storage.set(TOUR_KEY, true);
    setVisible(false);
  };
  const restart = () => {
    storage.remove(TOUR_KEY);
    setVisible(true);
  };
  return { visible, close, neverShowAgain, restart };
}

const CARD_W = SW - Spacing.xl * 2;
const CARD_H = 230;
const CARD_TOP = (SH - CARD_H) / 2;
const CARD_LEFT = Spacing.xl;
const CARD_BOTTOM = CARD_TOP + CARD_H;

export default function AppTourOverlay() {
  const Colors = useColors();
  const { visible, close, neverShowAgain } = useAppTour();
  const [stepIdx, setStepIdx] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const targets = useTourStore((s) => s.targets);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setTick((x) => x + 1), 250);
    return () => clearTimeout(t);
  }, [stepIdx]);

  // step 진입 시 해당 탭으로 이동 — 사용자가 탭마다 실제 화면을 보면서 안내받음.
  useEffect(() => {
    if (!visible) return;
    const route = STEPS[stepIdx]?.route;
    if (route) router.replace(route as any);
  }, [stepIdx, visible]);

  if (!visible) return null;

  const step = STEPS[stepIdx];
  const targetId = step.targetId;
  const rawRect: TourTargetRect | undefined = targetId ? targets[targetId] : undefined;
  const rectInScreen =
    rawRect && rawRect.y + rawRect.height > 0 && rawRect.y < SH && rawRect.width > 0;
  const rect = rectInScreen ? rawRect : undefined;
  const shape = step.shape ?? 'circle';
  const isLast = stepIdx === STEPS.length - 1;
  const isFirst = stepIdx === 0;

  const finish = () => {
    if (dontShowAgain) neverShowAgain();
    else close();
  };
  const handleNext = () => {
    if (isLast) finish();
    else setStepIdx((i) => i + 1);
  };
  const handlePrev = () => {
    if (!isFirst) setStepIdx((i) => i - 1);
  };


  // 카드 위치/크기 — target 없으면 step.cardLayout 기준, 있으면 spotlight 회피.
  let cardTop = CARD_TOP;
  let cardLeft = CARD_LEFT;
  let cardWidth = CARD_W;
  if (!rect && step.cardLayout) {
    cardTop = SH * step.cardLayout.topR;
    cardLeft = SW * step.cardLayout.leftR;
    cardWidth = SW * step.cardLayout.widthR;
  }
  if (rect) {
    const overlapsY = !(rect.y >= CARD_BOTTOM || rect.y + rect.height <= CARD_TOP);
    if (overlapsY) {
      const TOP_MIN = 60;
      const BOTTOM_MAX = SH - 40;
      const aboveTop = rect.y - CARD_H - 24;
      const belowTop = rect.y + rect.height + 24;
      const aboveFits = aboveTop >= TOP_MIN;
      const belowFits = belowTop + CARD_H <= BOTTOM_MAX;
      if (aboveFits) cardTop = aboveTop;
      else if (belowFits) cardTop = belowTop;
      else {
        // 둘 다 부족 — 위 공간이 더 크면 위로(overlap 허용), 아니면 아래로 clip.
        const spaceAbove = rect.y - TOP_MIN;
        const spaceBelow = BOTTOM_MAX - (rect.y + rect.height);
        cardTop = spaceAbove > spaceBelow
          ? Math.max(TOP_MIN, rect.y - CARD_H - 8)
          : Math.min(belowTop, BOTTOM_MAX - CARD_H);
      }
    }
  }

  // SVG cutout overlay path 만들기.
  // outer rect + inner shape (역방향) — fillRule=evenodd 로 inner 영역 비움.
  // outer 를 화면 밖까지 키워서 blur 가 화면 가장자리에서 fade 되지 않게.
  const buildOverlayPath = () => {
    const M = 120;  // 화면 밖 margin — blur 가 화면 끝에서 새지 않도록
    const outer = `M${-M} ${-M} H${SW + M} V${SH + M} H${-M} Z`;
    if (!rect) return outer;
    if (shape === 'cutout') {
      // 크기는 사용자 원본 영역 그대로 (좌우는 화면 가장자리 가까이 자연스러움 유지).
      const padX = -8;   // 음수 = 안쪽으로                                        
      const padY = 4;                                                              
      const x = rect.x - padX;                                                     
      const y = rect.y - padY;                                                     
      const w = rect.width + padX * 2;                                             
      const h = rect.height + padY * 2;                                            
      const r = 16;  
      const inner = `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;
      return `${outer} ${inner}`;
    }
    // circle cutout
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const radius = Math.max(rect.width, rect.height) / 2 + 12;
    const inner = `M${cx - radius} ${cy} A${radius} ${radius} 0 1 0 ${cx + radius} ${cy} A${radius} ${radius} 0 1 0 ${cx - radius} ${cy} Z`;
    return `${outer} ${inner}`;
  };

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <View style={{ flex: 1 }} key={tick}>
        {/* === SVG: cutout overlay + spotlight border + 곱선 점선 화살표 === */}
        <Svg
          pointerEvents="none"
          width={SW} height={SH}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {shape === 'circle' && rect ? (() => {
            // RadialGradient — 진짜 spotlight 효과 (가장자리 부드럽게 fade out)
            const cx = rect.x + rect.width / 2;
            const cy = rect.y + rect.height / 2;
            const spotR = Math.max(rect.width, rect.height) / 2 + 14; // 완전 투명 반경
            const fadeR = spotR + 10;                                  // fade 폭 (아주 얇게)
            const maxR = Math.max(SW, SH) * 1.5;                       // 화면 전체 덮음
            const innerStop = (spotR / maxR).toFixed(4);
            const midStop = (fadeR / maxR).toFixed(4);
            return (
              <>
                <Defs>
                  <RadialGradient
                    id="spotGrad"
                    cx={cx} cy={cy}
                    rx={maxR} ry={maxR}
                    fx={cx} fy={cy}
                    gradientUnits="userSpaceOnUse"
                  >
                    <Stop offset="0" stopColor="rgb(15,23,42)" stopOpacity="0" />
                    <Stop offset={innerStop} stopColor="rgb(15,23,42)" stopOpacity="0" />
                    <Stop offset={midStop} stopColor="rgb(15,23,42)" stopOpacity="0.78" />
                    <Stop offset="1" stopColor="rgb(15,23,42)" stopOpacity="0.78" />
                  </RadialGradient>
                </Defs>
                <Rect x={0} y={0} width={SW} height={SH} fill="url(#spotGrad)" />
              </>
            );
          })() : (
            /* cutout — mask 로 cutout 영역만 blur, 화면 가장자리는 hard OVERLAY 유지.
               Mask: white=fill 적용, black=투명. black rect 에만 blur → cutout 가장자리만 fade. */
            (() => {
              if (!rect) {
                // target 없는 step — 화면 전체 그대로 보이게, 카드 시인성 위해 옅은 dim 만.
                return <Rect x={0} y={0} width={SW} height={SH} fill="rgba(15,23,42,0.22)" />;
              }
              const padX = -8;
              const padY = 4;
              const x = rect.x - padX;
              const y = rect.y - padY;
              const w = rect.width + padX * 2;
              const h = rect.height + padY * 2;
              const r = 16;
              return (
                <>
                  <Defs>
                    <Filter id="cutoutBlur">
                      <FeGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
                    </Filter>
                    <Mask id="cutoutMask">
                      <Rect x={0} y={0} width={SW} height={SH} fill="white" />
                      <Rect
                        x={x} y={y} width={w} height={h} rx={r} ry={r}
                        fill="black"
                        filter="url(#cutoutBlur)"
                      />
                    </Mask>
                  </Defs>
                  <Rect x={0} y={0} width={SW} height={SH} fill={OVERLAY} mask="url(#cutoutMask)" />
                </>
              );
            })()
          )}
        </Svg>

        {/* === 카드 — 기본 화면 중앙. spotlight 와 겹치면 자동 회피, cardLayout 있으면 그대로. === */}
        <View
          style={{
            position: 'absolute',
            left: cardLeft,
            width: cardWidth,
            top: cardTop,
            backgroundColor: Colors.surfaceElevated,
            borderRadius: Spacing.borderRadius.xl,
            padding: Spacing.lg,
            gap: Spacing.sm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
            <Pressable
              onPress={() => setDontShowAgain((v) => !v)}
              hitSlop={Spacing.hitSlop}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <View
                style={{
                  width: 16, height: 16, borderRadius: 4,
                  borderWidth: 1.5,
                  borderColor: dontShowAgain ? Colors.primaryDark : Colors.borderStrong,
                  backgroundColor: dontShowAgain ? Colors.primaryDark : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                {dontShowAgain ? <Feather name="check" size={11} color={Colors.white} /> : null}
              </View>
              <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                다시 보지 않기
              </Text>
            </Pressable>
          </View>
          <Text style={{ ...Typography.preset.heading, color: Colors.text.primary, fontWeight: Typography.weight.bold }}>
            {step.title}
          </Text>
          <Text style={{ ...Typography.preset.body, color: Colors.text.secondary }}>
            {step.body}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm }}>
            <Pressable onPress={finish} hitSlop={Spacing.hitSlop}>
              <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                건너뛰기
              </Text>
            </Pressable>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              {!isFirst ? (
                <Button onPress={handlePrev} variant="ghost" size="sm">
                  이전
                </Button>
              ) : null}
              <Button onPress={handleNext} variant="primary" size="sm">
                {isLast ? '시작하기' : '다음'}
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
