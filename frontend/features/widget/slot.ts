// 시간대 슬롯 — CareTab 의 timeSlot 매핑과 동일 규칙을 위젯(헤드리스 JS)에서 재사용한다.
// 이 파일은 react-native / expo 의존성이 없어야 한다 (위젯 task handler 가 헤드리스로 로드).

export type TimeSlot = 'morning' | 'lunch' | 'afternoon' | 'evening' | 'night' | 'none';

export const SLOT_ORDER: TimeSlot[] = ['morning', 'lunch', 'afternoon', 'evening', 'night', 'none'];

// 슬롯 라벨은 i18n widget.slot.{slot}. 이 파일은 헤드리스용이라 react/expo(=i18n→MMKV) 의존을
// 두지 않으려고 라벨을 갖지 않는다. 렌더 컴포넌트가 i18n.t 로 직접 변환한다.

/** "HH:mm" → 슬롯. 시간 없으면 'none'. CareTab.timeSlot 과 경계 동일. */
export function slotForTime(reminderTime: string | null): TimeSlot {
  if (!reminderTime) return 'none';
  const h = Number(reminderTime.split(':')[0]);
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 14) return 'lunch';
  if (h >= 14 && h < 18) return 'afternoon';
  if (h >= 18 && h < 22) return 'evening';
  return 'night';
}

/** 현재 시각이 속한 슬롯 — 'none' 은 반환하지 않는다 (항상 실제 시간대). */
export function currentSlot(now: Date): Exclude<TimeSlot, 'none'> {
  const h = now.getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 14) return 'lunch';
  if (h >= 14 && h < 18) return 'afternoon';
  if (h >= 18 && h < 22) return 'evening';
  return 'night';
}

/**
 * 위젯에 보여줄 "활성 슬롯" 선택 — 현재 시간대에 할 일이 있으면 그걸,
 * 없으면 현재 시간대 이후로 가장 가까운(없으면 그 외 아무) 비어있지 않은 슬롯을 고른다.
 * 시간 미지정('none') 항목은 마지막 폴백으로만.
 */
export function pickActiveSlot<T extends { slot: TimeSlot }>(
  tasks: T[],
  now: Date,
): { slot: TimeSlot; tasks: T[] } {
  const cur = currentSlot(now);
  const byCurrent = tasks.filter((t) => t.slot === cur);
  if (byCurrent.length > 0) return { slot: cur, tasks: byCurrent };

  // 현재 슬롯 이후 → 처음으로 다시 → 'none' 순으로 탐색
  const startIdx = SLOT_ORDER.indexOf(cur);
  const search = [...SLOT_ORDER.slice(startIdx), ...SLOT_ORDER.slice(0, startIdx)];
  for (const s of search) {
    const found = tasks.filter((t) => t.slot === s);
    if (found.length > 0) return { slot: s, tasks: found };
  }
  return { slot: cur, tasks: [] };
}

/**
 * 전체 모드에서 한 펫이 상위를 독점하지 않게 펫별 라운드로빈으로 재배열.
 * (펫 등장 순서·펫 내부 순서는 유지) 예: 설기·코코·보리·설기·코코…
 */
export function interleaveByPet<T extends { petId: number }>(tasks: T[]): T[] {
  const byPet = new Map<number, T[]>();
  const order: number[] = [];
  for (const t of tasks) {
    if (!byPet.has(t.petId)) {
      byPet.set(t.petId, []);
      order.push(t.petId);
    }
    byPet.get(t.petId)!.push(t);
  }
  const out: T[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const pid of order) {
      const arr = byPet.get(pid)!;
      if (arr.length > 0) {
        out.push(arr.shift()!);
        added = true;
      }
    }
  }
  return out;
}
