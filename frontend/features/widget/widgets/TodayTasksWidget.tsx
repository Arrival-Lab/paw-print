import React from 'react';
import { pickActiveSlot, SLOT_LABEL } from '../slot';
import { WIDGET_LINKS, type WidgetConfig, type WidgetSnapshot } from '../types';
import { Card, CheckRow, Header, Hero, HintBody, MoreLink, type Wid } from './parts';

/**
 * A — 오늘 할 일 위젯. 인스턴스 설정(config)에 따라 전체 펫 또는 특정 펫.
 * - 전체 4×2: 통합 리스트(줄별 펫 아바타) / 전체 2×2: 큰 진행 요약(N/M).
 * - 펫지정: 그 펫의 현재 시간대 리스트 (2×2/4×2 모두).
 */
export function TodayTasksWidget({
  snapshot,
  width,
  c,
  config = 'all',
}: {
  snapshot: WidgetSnapshot | null;
  width: number;
  c: Wid;
  config?: WidgetConfig;
}) {
  const wide = width >= 200;

  if (!snapshot || !snapshot.loggedIn) {
    return (
      <Card link={WIDGET_LINKS.home} c={c}>
        <HintBody c={c} title="발자국" sub="로그인하고 오늘의 케어를 시작하세요" />
      </Card>
    );
  }
  if (snapshot.pets.length === 0) {
    return (
      <Card link={WIDGET_LINKS.petNew} c={c}>
        <HintBody c={c} title="반려동물을 등록해주세요" sub="첫 펫을 등록하면 오늘 할 일이 보여요" />
      </Card>
    );
  }

  // 설정된 펫이 존재하면 펫모드, 아니면(또는 'all') 전체모드.
  const selectedPet = config !== 'all' ? snapshot.pets.find((p) => p.id === config) ?? null : null;
  // 전체 모드라도 펫이 1마리면 그 펫을 헤더에 (멀티 줄별 아바타는 생략).
  const soloPet = selectedPet ?? (snapshot.pets.length === 1 ? snapshot.pets[0] : null);
  const multi = !soloPet;

  const scope = selectedPet ? snapshot.tasks.filter((t) => t.petId === selectedPet.id) : snapshot.tasks;
  const done = scope.filter((t) => t.done).length;
  const total = scope.length;
  const fraction = `${done}/${total}`;
  const dots = { done, total };

  if (total === 0) {
    return (
      <Card link={WIDGET_LINKS.daily} c={c}>
        <TaskHeader c={c} soloPet={soloPet} multi={multi} wide={wide} slotTitle="오늘 할 일" />
        <HintBody c={c} title="오늘 할 일이 없어요" sub="케어 체크리스트를 추가해보세요" />
      </Card>
    );
  }

  const { slot, tasks } = pickActiveSlot(scope, new Date());

  // 전체 모드 2×2 → 큰 진행 요약(좁아서 멀티펫 리스트 안 들어감)
  if (!wide && multi) {
    return (
      <Card link={WIDGET_LINKS.daily} c={c}>
        <Header c={c} emoji="🐾" title="우리집 · 오늘" />
        <Hero c={c} big={fraction} caption="오늘 완료" dots={dots} />
      </Card>
    );
  }

  const limit = wide ? 3 : 2;
  const shown = tasks.slice(0, limit);
  const more = tasks.length - shown.length;

  return (
    <Card link={WIDGET_LINKS.daily} c={c}>
      <TaskHeader
        c={c}
        soloPet={soloPet}
        multi={multi}
        wide={wide}
        slotTitle={`${SLOT_LABEL[slot]} 할 일`}
        slotLabel={SLOT_LABEL[slot]}
        rightText={fraction}
        dots={dots}
      />
      {shown.map((t, i) => (
        <CheckRow
          key={i}
          c={c}
          name={t.name}
          done={t.done}
          petImage={multi ? t.petImage : undefined}
          meta={multi ? t.petName : undefined}
        />
      ))}
      {more > 0 ? <MoreLink count={more} c={c} /> : null}
    </Card>
  );
}

function TaskHeader({
  c,
  soloPet,
  multi,
  wide,
  slotTitle,
  slotLabel,
  rightText,
  dots,
}: {
  c: Wid;
  soloPet: { name: string; image: string | null } | null;
  multi: boolean;
  wide: boolean;
  slotTitle: string;
  slotLabel?: string;
  rightText?: string;
  dots?: { done: number; total: number };
}) {
  if (multi) {
    return (
      <Header
        c={c}
        emoji="🐾"
        title={wide && slotLabel ? `오늘 할 일 · ${slotLabel}` : slotTitle}
        rightText={rightText}
        dots={dots}
      />
    );
  }
  return (
    <Header
      c={c}
      image={soloPet?.image ?? null}
      title={wide && soloPet ? `${soloPet.name} · ${slotTitle}` : slotTitle}
      rightText={rightText}
      dots={dots}
    />
  );
}
