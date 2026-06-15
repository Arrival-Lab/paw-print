import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import type { Pet } from '../pet/api/petApi';
import type { HomeCare } from '../care/api/careApi';
import type { AppointmentWithPet } from '../appointment/api/appointmentApi';
import { buildSnapshot } from './buildSnapshot';

/**
 * 홈 화면 데이터(펫·오늘 케어·다가오는 예약)를 위젯 MMKV 스냅샷으로 동기화하고 위젯 갱신을 요청한다.
 * - Android 전용. iOS 에서는 react-native-android-widget 를 아예 require 하지 않는다.
 * - React Query 의 구조적 공유로 데이터 미변경 시 참조가 안정적이라 effect 가 반복 실행되지 않는다.
 */
export function useWidgetSync(
  pets: Pet[],
  homeCare: HomeCare[],
  appointments: AppointmentWithPet[],
): void {
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const snapshot = buildSnapshot({ pets, homeCare, appointments });
    // updatedAt 제외 내용 해시 — 로딩 중 빈 배열 기본값으로 반복 갱신되는 것을 막는다.
    const key = JSON.stringify({ ...snapshot, updatedAt: 0 });
    if (key === lastKey.current) return;
    lastKey.current = key;
    // Android 전용 모듈을 지연 로드 — iOS 번들에서 네이티브 접근 차단.
    const { updateAllWidgets } = require('./updateWidgets');
    updateAllWidgets(snapshot);
  }, [pets, homeCare, appointments]);
}
