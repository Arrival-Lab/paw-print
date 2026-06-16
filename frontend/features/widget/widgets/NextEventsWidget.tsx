import React from 'react';
import i18n from '../../../shared/i18n';
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
        <HintBody c={c} title={i18n.t('auth.appName')} sub={i18n.t('widget.events.loginSub')} />
      </Card>
    );
  }
  if (snapshot.events.length === 0) {
    return (
      <Card link={WIDGET_LINKS.appointments} c={c}>
        <Header c={c} emoji="📅" title={wide ? i18n.t('widget.events.upcoming') : i18n.t('widget.events.next')} />
        <HintBody c={c} title={i18n.t('widget.noEventsTitle')} sub={i18n.t('widget.events.noEventsSub')} />
      </Card>
    );
  }

  // 2×2 — 첫 일정의 큰 D-day 히어로
  if (!wide) {
    const e = snapshot.events[0];
    return (
      <Card link={WIDGET_LINKS.appointments} c={c}>
        <Header c={c} emoji="📅" title={i18n.t('widget.events.next')} />
        <Hero c={c} big={dDayLabel(e.dDay)} sub={`${e.petName} · ${e.title}`} caption={e.when} />
      </Card>
    );
  }

  // 4×2 — 높이만큼 일정 리스트
  const shown = snapshot.events.slice(0, maxEvents);
  return (
    <Card link={WIDGET_LINKS.appointments} c={c}>
      <Header c={c} emoji="📅" title={i18n.t('widget.events.upcoming')} />
      {shown.map((e, i) => (
        <EventRow key={i} c={c} petName={e.petName} title={e.title} when={e.when} dDay={e.dDay} />
      ))}
    </Card>
  );
}
