import i18n from '../../shared/i18n';
import type { Pet } from '../pet/api/petApi';
import type { HomeCare } from '../care/api/careApi';
import type { AppointmentWithPet } from '../appointment/api/appointmentApi';
import { slotForTime } from './slot';
import type { WidgetEvent, WidgetSnapshot, WidgetTask } from './types';

/** ISO datetime → "6/18 (목) 14:00" (요일은 현재 언어). buildSnapshot 은 포그라운드 호출이라 i18n 사용 가능. */
function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const weekday = i18n.t('widget.weekday', { returnObjects: true }) as string[];
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const w = weekday[d.getDay()];
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${mm}/${dd} (${w}) ${hh}:${min}`;
}

/**
 * React Query 데이터 → 위젯 스냅샷. 순수 함수 (앱 포그라운드에서 호출).
 * 대표 펫: homeCare 첫 항목(없으면 펫 목록 첫 항목). 멀티펫 가구의 펫 선택은 추후 위젯 구성으로.
 */
export function buildSnapshot(input: {
  pets: Pet[];
  homeCare: HomeCare[];
  appointments: AppointmentWithPet[];
  now?: Date;
}): WidgetSnapshot {
  const { pets, homeCare, appointments } = input;
  const now = input.now ?? new Date();

  const imageByPetId = new Map(pets.map((p) => [p.id, p.profileImage]));

  // 전체 펫 × 모든 시간대 할 일. 각 줄에 펫 정보를 태깅해 위젯에서 전체/펫별 필터.
  const tasks: WidgetTask[] = [];
  for (const hc of homeCare) {
    for (const it of hc.items) {
      tasks.push({
        petId: hc.petId,
        petName: hc.petName,
        petImage: imageByPetId.get(hc.petId) ?? null,
        name: it.name,
        done: it.count >= it.targetCount,
        slot: slotForTime(it.reminderTime),
        time: it.reminderTime,
      });
    }
  }

  const events: WidgetEvent[] = appointments
    .filter((a) => a.dDay >= 0)
    .sort((a, b) => a.dDay - b.dDay)
    .slice(0, 5)
    .map((a) => ({
      petName: a.petName,
      title: a.reason?.trim() || i18n.t('widget.defaultEventTitle'),
      dDay: a.dDay,
      when: formatWhen(a.appointmentAt),
    }));

  return {
    v: 2,
    updatedAt: now.getTime(),
    loggedIn: true,
    pets: pets.map((p) => ({ id: p.id, name: p.name, image: p.profileImage })),
    tasks,
    events,
  };
}
