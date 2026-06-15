import { createMMKV } from 'react-native-mmkv';
import type { WidgetConfig, WidgetName, WidgetSnapshot } from './types';

// 앱 본체(shared/utils/storage.ts)와 같은 MMKV id 를 공유한다 — 같은 인스턴스를 가리킨다.
// 위젯 task handler 는 헤드리스 JS 라서 React Query/Zustand 에 접근 못 하고 이 MMKV 만 읽는다.
const storage = createMMKV({ id: 'pawprint-storage' });

const SNAPSHOT_KEY = 'widget_snapshot';
const WIDTH_KEY_PREFIX = 'widget_width:'; // 위젯별 마지막으로 측정된 폭(dp) — 2×2/4×2 레이아웃 선택용
const CONFIG_KEY_PREFIX = 'widget_cfg:'; // 인스턴스(widgetId)별 펫 설정 ('all' | petId)

export function readSnapshot(): WidgetSnapshot | null {
  const raw = storage.getString(SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as WidgetSnapshot;
    return v?.v === 2 ? v : null;
  } catch {
    return null;
  }
}

export function writeSnapshot(snapshot: WidgetSnapshot): void {
  storage.set(SNAPSHOT_KEY, JSON.stringify(snapshot));
}

/** 로그아웃 시 호출 — clearAuth 에서 사용. 위젯이 이전 유저 데이터를 노출하지 않게 한다. */
export function clearSnapshot(): void {
  storage.remove(SNAPSHOT_KEY);
}

/**
 * task handler 가 WIDGET_ADDED/RESIZED/UPDATE 에서 받은 실제 폭을 저장.
 * 앱이 requestWidgetUpdate 로 갱신할 땐 폭 정보가 없으므로 이 값을 읽어 레이아웃을 고른다.
 */
export function rememberWidth(name: WidgetName, width: number): void {
  if (width > 0) storage.set(`${WIDTH_KEY_PREFIX}${name}`, width);
}

export function recallWidth(name: WidgetName): number {
  return storage.getNumber(`${WIDTH_KEY_PREFIX}${name}`) ?? 0;
}

/** 인스턴스(widgetId)별 펫 설정 — 'all' 또는 petId. 기본 'all'. */
export function readConfig(widgetId: number): WidgetConfig {
  const raw = storage.getString(`${CONFIG_KEY_PREFIX}${widgetId}`);
  if (!raw || raw === 'all') return 'all';
  const n = Number(raw);
  return Number.isFinite(n) ? n : 'all';
}

export function writeConfig(widgetId: number, config: WidgetConfig): void {
  storage.set(`${CONFIG_KEY_PREFIX}${widgetId}`, config === 'all' ? 'all' : String(config));
}

export function clearConfig(widgetId: number): void {
  storage.remove(`${CONFIG_KEY_PREFIX}${widgetId}`);
}
