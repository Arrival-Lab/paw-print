import { create } from 'zustand';

export interface TourTargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 투어 target 좌표 저장소.
 * 각 target component 는 mount 시 ref.measureInWindow 로 좌표 등록.
 * AppTourOverlay 가 store 에서 좌표 가져와 spotlight 그림.
 *
 * remeasureNonce: 단조 증가 카운터. AppTourOverlay 가 step 전환·콘텐츠 변화 시 increment 하고,
 * 각 TourTarget 이 이 값을 useEffect 의존성으로 구독해 측정을 강제 재실행한다.
 * 부모 컨테이너 변화로 절대 좌표가 변해도 자식 onLayout 은 발동 안 함 → 외부 트리거 필요.
 */
interface TourState {
  targets: Record<string, TourTargetRect>;
  remeasureNonce: number;
  setTarget: (id: string, rect: TourTargetRect) => void;
  clearTarget: (id: string) => void;
  triggerRemeasure: () => void;
}

export const useTourStore = create<TourState>((set) => ({
  targets: {},
  remeasureNonce: 0,
  setTarget: (id, rect) =>
    set((s) => ({ targets: { ...s.targets, [id]: rect } })),
  clearTarget: (id) =>
    set((s) => {
      const next = { ...s.targets };
      delete next[id];
      return { targets: next };
    }),
  triggerRemeasure: () => set((s) => ({ remeasureNonce: s.remeasureNonce + 1 })),
}));

/** target id 상수 — 오타 방지. */
export const TOUR_TARGETS = {
  EMERGENCY: 'emergency',
  TAB_DIARY: 'tab-diary',
  TAB_DAILY: 'tab-daily',
  TAB_HEALTH: 'tab-health',
  TAB_COMMUNITY: 'tab-community',
  TAB_MYPAGE: 'tab-mypage',
  FAB: 'fab',
  HOME_PET_GROUP: 'home-pet-group',
  HOME_UPCOMING: 'home-upcoming',
} as const;
