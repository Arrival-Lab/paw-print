import type { TimeSlot } from './slot';

/** 위젯 식별 이름 — app.json 의 react-native-android-widget widgets[].name 과 일치해야 한다. */
export const WIDGET_NAMES = ['TodayTasks', 'NextEvents', 'Dashboard'] as const;
export type WidgetName = (typeof WIDGET_NAMES)[number];

/**
 * 위젯 탭 시 여는 딥링크. scheme=pawprint (app.json). expo-router 가 경로 기반으로 라우팅.
 * (tabs) 그룹은 URL 에서 생략되므로 /daily 로 진입.
 */
export const WIDGET_LINKS = {
  daily: 'pawprint:///daily?tab=daily-check',
  appointments: 'pawprint:///appointments/all',
  recordCreate: 'pawprint:///records/create',
  petNew: 'pawprint:///pets/new',
  home: 'pawprint:///',
} as const;

export interface WidgetTask {
  petId: number;
  petName: string;
  petImage: string | null;
  name: string;
  done: boolean;
  slot: TimeSlot;
  time: string | null; // "HH:mm"
}

/** 위젯 인스턴스별 설정 — 'all'(전체) 또는 특정 petId. widgetId 기준으로 MMKV 저장. */
export type WidgetConfig = number | 'all';

export interface WidgetEvent {
  petName: string;
  title: string; // 사유 또는 "예약"
  dDay: number; // 0 = 오늘, 양수 = 남은 일수
  when: string; // "6/18 (목) 14:00"
}

/**
 * 위젯이 MMKV 에서 읽는 단일 스냅샷. 앱(포그라운드)이 React Query 데이터를 여기에 직렬화하고,
 * 헤드리스 위젯 task handler 는 이 스냅샷만 읽어 렌더한다 (React Query/Zustand 접근 불가).
 * tasks 는 전체 펫 × 모든 시간대를 담아두고, 위젯이 렌더 시점에 현재 시간대를 고른다
 * (앱 안 켜도 시간대 전환). 각 task 에 펫 정보가 붙어 멀티펫 가구도 전체가 보인다.
 */
export interface WidgetSnapshot {
  v: 2;
  updatedAt: number;
  loggedIn: boolean;
  /** 보유 펫 목록 (헤더 단일/멀티 분기 + 설정 화면 선택지). 미로그인·펫없음이면 빈 배열. */
  pets: { id: number; name: string; image: string | null }[];
  tasks: WidgetTask[];
  events: WidgetEvent[];
}
