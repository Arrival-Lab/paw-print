import React from 'react';
import { WIDGET_LINKS, type WidgetSnapshot } from '../types';
import { Card, EventRow, Header, Hero, HintBody, dDayLabel, type Wid } from './parts';

/**
 * B — 다가오는 일정 위젯. 전체 펫의 다음 예약까지 남은 날(D-day).
 * 4×2(wide): 일정 3개 + 시간 / 2×2(narrow): 첫 일정의 큰 D-day 히어로.
 */
export function NextEventsWidget({
  snapshot,
  width,
  height,
  c,
}: {
  snapshot: WidgetSnapshot | null;
  width: number;
  height: number;
  c: Wid;
}) {
  const wide = width >= 200;
  // 일정 한 줄은 2줄(제목+날짜)이라 ≈ 40dp. 높이만큼 더 보여준다.
  const maxEvents = Math.max(1, Math.floor((height - 50) / 40));

  if (!snapshot || !snapshot.loggedIn) {
    return (
      <Card link={WIDGET_LINKS.home} c={c}>
        <HintBody c={c} title="발자국" sub="로그인하면 다가오는 일정을 볼 수 있어요" />
      </Card>
    );
  }
  if (snapshot.events.length === 0) {
    return (
      <Card link={WIDGET_LINKS.appointments} c={c}>
        <Header c={c} emoji="📅" title={wide ? '다가오는 일정' : '다음 일정'} />
        <HintBody c={c} title="예정된 일정이 없어요" sub="예약을 등록하면 D-day 가 보여요" />
      </Card>
    );
  }

  // 2×2 — 첫 일정의 큰 D-day 히어로
  if (!wide) {
    const e = snapshot.events[0];
    return (
      <Card link={WIDGET_LINKS.appointments} c={c}>
        <Header c={c} emoji="📅" title="다음 일정" />
        <Hero c={c} big={dDayLabel(e.dDay)} sub={`${e.petName} · ${e.title}`} caption={e.when} />
      </Card>
    );
  }

  // 4×2 — 높이만큼 일정 리스트
  const shown = snapshot.events.slice(0, maxEvents);
  return (
    <Card link={WIDGET_LINKS.appointments} c={c}>
      <Header c={c} emoji="📅" title="다가오는 일정" />
      {shown.map((e, i) => (
        <EventRow key={i} c={c} petName={e.petName} title={e.title} when={e.when} dDay={e.dDay} />
      ))}
    </Card>
  );
}
