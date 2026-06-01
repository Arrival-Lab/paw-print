import { Children, cloneElement, isValidElement, useCallback, useEffect, useRef } from 'react';
import { View, ViewProps, useWindowDimensions } from 'react-native';
import { useTourStore } from '../store/tourStore';

interface Props extends ViewProps {
  tourId: string;
  /** spotlight 모양 결정용. 기본 'rect'. circle 이면 borderRadius=min(w,h)/2. */
  shape?: 'rect' | 'circle';
  /** true 면 항상 wrap View 모드 (cloneElement 안 함). 함수 컴포넌트 children 일 때 필요. */
  wrap?: boolean;
}

/**
 * 투어 target 으로 등록되는 wrapper.
 * 단일 React element 면 cloneElement 로 ref 직접 주입 (transform·marginTop 등 정확 측정).
 * 여러 child 면 wrapping View 로.
 *
 * 측정 재실행 트리거:
 *  - mount/onLayout: 자식 자신의 layout 변화
 *  - tourStore.remeasureNonce: step 전환·콘텐츠 비동기 변화로 부모가 밀려 절대 좌표가 변할 때 (자식 onLayout 안 잡힘)
 *  - useWindowDimensions: 화면 회전·시스템 글자 크기(fontScale) 변경
 */
export default function TourTarget({ tourId, children, wrap = false, ...rest }: Props) {
  const ref = useRef<View>(null);
  const setTarget = useTourStore((s) => s.setTarget);
  const clearTarget = useTourStore((s) => s.clearTarget);
  const remeasureNonce = useTourStore((s) => s.remeasureNonce);
  const { width: winW, height: winH, fontScale } = useWindowDimensions();

  const measure = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    // RAF 로 layout commit 후 측정 — 같은 frame 에 measure 호출하면 이전 layout 값이 잡힐 수 있음.
    requestAnimationFrame(() => {
      (node as any).measureInWindow?.((x: number, y: number, width: number, height: number) => {
        if (width > 0 && height > 0) {
          setTarget(tourId, { x, y, width, height });
        }
      });
    });
  }, [tourId, setTarget]);

  // mount + 외부 트리거(nonce·dim·fontScale) 시점에 짧은 지연 두 번 측정 — animation/interaction 안정화 후.
  useEffect(() => {
    const t1 = setTimeout(measure, 50);
    const t2 = setTimeout(measure, 250);
    const t3 = setTimeout(measure, 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [measure, remeasureNonce, winW, winH, fontScale]);

  // unmount 시에만 clearTarget — re-measure effect 와 분리해서 중간에 좌표가 비는 frame 없음.
  useEffect(() => {
    return () => clearTarget(tourId);
  }, [tourId, clearTarget]);

  // 단일 element 면 cloneElement 로 ref 직접 주입.
  // 이러면 wrap View 가 추가 안 됨 → marginTop, transform 등의 layout 영향이 measure 에 정확 반영.
  // wrap=true 면 강제 wrapping View (함수 컴포넌트 children 처럼 ref forward 안 되는 케이스).
  const child = !wrap && Children.count(children) === 1 ? children : null;
  if (child && isValidElement(child)) {
    const existingRef = (child as any).ref;
    const existingOnLayout = (child.props as any).onLayout;
    return cloneElement(child as any, {
      ref: (node: any) => {
        ref.current = node;
        if (typeof existingRef === 'function') existingRef(node);
        else if (existingRef && 'current' in existingRef) existingRef.current = node;
      },
      onLayout: (e: any) => {
        existingOnLayout?.(e);
        measure();
      },
      collapsable: false,
    });
  }

  // fallback: 여러 child / non-element 면 wrapping View.
  return (
    <View ref={ref} collapsable={false} onLayout={measure} {...rest}>
      {children}
    </View>
  );
}
