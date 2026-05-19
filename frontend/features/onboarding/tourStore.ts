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
 */
interface TourState {
  targets: Record<string, TourTargetRect>;
  setTarget: (id: string, rect: TourTargetRect) => void;
  clearTarget: (id: string) => void;
}

export const useTourStore = create<TourState>((set) => ({
  targets: {},
  setTarget: (id, rect) =>
    set((s) => ({ targets: { ...s.targets, [id]: rect } })),
  clearTarget: (id) =>
    set((s) => {
      const next = { ...s.targets };
      delete next[id];
      return { targets: next };
    }),
}));

/** target id 상수 — 오타 방지. */
export const TOUR_TARGETS = {
  EMERGENCY: 'emergency',
  TAB_DIARY: 'tab-diary',
  TAB_RECORDS: 'tab-records',
  TAB_COMMUNITY: 'tab-community',
  TAB_MYPAGE: 'tab-mypage',
  FAB: 'fab',
  HOME_FILTER: 'home-filter',
  HOME_PET_GROUP: 'home-pet-group',
  HOME_UPCOMING: 'home-upcoming',
} as const;
