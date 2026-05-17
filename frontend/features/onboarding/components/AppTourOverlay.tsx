import { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { createMMKV } from 'react-native-mmkv';
import Svg, { Defs, Marker, Mask, Path, Polygon, RadialGradient, Rect, Stop, Filter, FeGaussianBlur } from 'react-native-svg';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import Button from '../../../shared/components/Button';
import { useTourStore, TOUR_TARGETS, type TourTargetRect } from '../tourStore';

const storage = createMMKV({ id: 'pawprint-onboarding' });
const TOUR_KEY = 'app-tour-shown-v2';

const { width: SW, height: SH } = Dimensions.get('window');
const OVERLAY = 'rgba(15, 23, 42, 0.78)';

interface Step {
  targetId: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  body: string;
  shape?: 'circle' | 'cutout';
}

const STEPS: Step[] = [
  { targetId: TOUR_TARGETS.EMERGENCY, icon: 'plus-square', title: '응급 동물병원',
    body: '가까운 동물병원을 찾을 수 있어요. 야간엔 24시 동물병원이 표시돼요.', shape: 'circle' },
  { targetId: TOUR_TARGETS.TAB_DIARY, icon: 'calendar', title: '다이어리',
    body: '내 반려동물과의 하루를 기록해요.', shape: 'circle' },
  { targetId: TOUR_TARGETS.TAB_RECORDS, icon: 'book-open', title: '기록',
    body: '진료 예약·기록, 예방접종, 영양제 및 처방약 등 각종 케어 정보를 기록할 수 있어요.', shape: 'circle' },
  { targetId: TOUR_TARGETS.TAB_HOME, icon: 'home', title: '홈',
    body: '오늘 챙길 것, 다가오는 일정, 이번 주 활동이 한 화면에 모여있어요.', shape: 'circle' },
  { targetId: TOUR_TARGETS.TAB_COMMUNITY, icon: 'message-circle', title: '커뮤니티',
    body: '같은 고민을 가진 보호자들과 정보, 후기, 증상을 나눠요.', shape: 'circle' },
  { targetId: TOUR_TARGETS.TAB_MYPAGE, icon: 'menu', title: '더보기',
    body: '반려동물 관리, 공유, 테마, 구독 등 모든 설정과 빠른 진입이 가능해요.', shape: 'circle' },
  { targetId: TOUR_TARGETS.FAB, icon: 'plus', title: '+ 버튼으로 빠른 추가',
    body: '다이어리·진료기록·병원 예약·예방접종 등 등록해야 할 것을 빠르게 추가할 수 있어요.', shape: 'circle' },
  { targetId: TOUR_TARGETS.HOME_CARE, icon: 'check-square', title: '오늘 케어',
    body: '매일 챙길 사료·산책·영양제 같은 케어를 체크리스트로. 가족, 친구와 공유하면 같이 채울 수 있어요.', shape: 'cutout' },
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
const CARD_RIGHT = SW - Spacing.xl;
const CARD_BOTTOM = CARD_TOP + CARD_H;
const CARD_CENTER_X = SW / 2;
const CARD_CENTER_Y = CARD_TOP + CARD_H / 2;

/** 카드 가장자리에서 target 방향 가장 가까운 점 + target 가장자리에서 카드 방향 가장 가까운 점. */
function computeArrow(rect: TourTargetRect, isCutoutShape: boolean) {
  const tx = rect.x + rect.width / 2;
  const ty = rect.y + rect.height / 2;

  let sx: number;
  let sy: number;
  const dx = tx - CARD_CENTER_X;
  const dy = ty - CARD_CENTER_Y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // 시작점 — 카드 가장자리 정확히
  if (absDy > absDx) {
    sy = dy > 0 ? CARD_BOTTOM : CARD_TOP;
    sx = CARD_CENTER_X;
  } else {
    sx = dx > 0 ? CARD_RIGHT : CARD_LEFT;
    sy = CARD_CENTER_Y;
  }

  // 끝점 = spotlight 영역 가장자리 바깥에 붙음
  const angle = Math.atan2(ty - sy, tx - sx);
  const SPOT_OUTSIDE = 6;
  let ex: number;
  let ey: number;
  if (isCutoutShape) {
    const halfW = rect.width / 2 + SPOT_OUTSIDE;
    const halfH = rect.height / 2 + SPOT_OUTSIDE;
    const t = Math.min(halfW / Math.abs(Math.cos(angle) || 0.001), halfH / Math.abs(Math.sin(angle) || 0.001));
    ex = tx - Math.cos(angle) * t;
    ey = ty - Math.sin(angle) * t;
  } else {
    const radius = Math.max(rect.width, rect.height) / 2 + SPOT_OUTSIDE;
    ex = tx - Math.cos(angle) * radius;
    ey = ty - Math.sin(angle) * radius;
  }

  // 한 번 휘는 베지어 곡선 — 곡률 크게.
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;
  const len = Math.hypot(ex - sx, ey - sy);
  const curve = Math.min(70, len * 0.38);
  const ndx = (ey - sy) / (len || 1);
  const ndy = -(ex - sx) / (len || 1);
  const cpAx = mx + ndx * curve;
  const cpAy = my + ndy * curve;
  const cpBx = mx - ndx * curve;
  const cpBy = my - ndy * curve;
  const distA = Math.hypot(cpAx - CARD_CENTER_X, cpAy - CARD_CENTER_Y);
  const distB = Math.hypot(cpBx - CARD_CENTER_X, cpBy - CARD_CENTER_Y);
  const cpx = distA > distB ? cpAx : cpBx;
  const cpy = distA > distB ? cpAy : cpBy;

  return { sx, sy, ex, ey, cpx, cpy };
}

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

  if (!visible) return null;

  const step = STEPS[stepIdx];
  const rawRect: TourTargetRect | undefined = targets[step.targetId];
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


  // 카드 위치 — spotlight 와 y축 겹치면 spotlight 위로 회피.
  let cardTop = CARD_TOP;
  if (rect) {
    const overlapsY = !(rect.y >= CARD_BOTTOM || rect.y + rect.height <= CARD_TOP);
    if (overlapsY) {
      const aboveTop = rect.y - CARD_H - 24;
      const belowTop = rect.y + rect.height + 24;
      // spotlight 위로 옮길 공간 있으면 위로, 아니면 아래로.
      cardTop = aboveTop >= 60 ? aboveTop : belowTop;
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
          <Defs>
            <Marker
              id="arrowTip"
              viewBox="0 0 10 10"
              refX="7" refY="5"
              markerWidth="5" markerHeight="5"
              orient="auto"
            >
              <Polygon points="0,0 10,5 0,10" fill={Colors.primary} />
            </Marker>
          </Defs>

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
                return <Rect x={0} y={0} width={SW} height={SH} fill={OVERLAY} />;
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

        {/* === 카드 — 기본 화면 중앙. spotlight 와 겹치면 자동 회피 === */}
        <View
          style={{
            position: 'absolute',
            left: CARD_LEFT,
            right: SW - CARD_RIGHT,
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
