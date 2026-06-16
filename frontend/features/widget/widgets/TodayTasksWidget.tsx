import React from 'react';
import i18n from '../../../shared/i18n';
import { interleaveByPet, pickActiveSlot } from '../slot';
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
  height,
  c,
  config = 'all',
}: {
  snapshot: WidgetSnapshot | null;
  width: number;
  height: number;
  c: Wid;
  config?: WidgetConfig;
}) {
  const wide = width >= 200;
  // 위젯 높이에 맞춰 표시할 줄 수 계산 — 늘릴수록 더 많이 보이고 빈 공간을 줄인다.
  // 헤더+카드패딩 ≈ 50dp, 한 줄 ≈ 29dp.
  const maxRows = Math.max(1, Math.floor((height - 50) / 29));

  if (!snapshot || !snapshot.loggedIn) {
    return (
      <Card link={WIDGET_LINKS.home} c={c}>
        <HintBody c={c} title={i18n.t('auth.appName')} sub={i18n.t('widget.today.loginSub')} />
      </Card>
    );
  }
  if (snapshot.pets.length === 0) {
    return (
      <Card link={WIDGET_LINKS.petNew} c={c}>
        <HintBody c={c} title={i18n.t('widget.registerPetTitle')} sub={i18n.t('widget.today.registerSub')} />
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
        <TaskHeader c={c} soloPet={soloPet} multi={multi} wide={wide} slotTitle={i18n.t('widget.today.tasksTitle')} />
        <HintBody c={c} title={i18n.t('widget.noTasksTitle')} sub={i18n.t('widget.today.noTasksSub')} />
      </Card>
    );
  }

  const picked = pickActiveSlot(scope, new Date());
  const slot = picked.slot;
  // 전체 모드면 펫이 골고루 보이게 라운드로빈, 펫 지정이면 그대로.
  const tasks = multi ? interleaveByPet(picked.tasks) : picked.tasks;

  // 전체 모드 2×2 → 큰 진행 요약(좁아서 멀티펫 리스트 안 들어감)
  if (!wide && multi) {
    return (
      <Card link={WIDGET_LINKS.daily} c={c}>
        <Header c={c} emoji="🐾" title={i18n.t('widget.today.homeToday')} />
        <Hero c={c} big={fraction} caption={i18n.t('widget.today.doneCaption')} dots={dots} />
      </Card>
    );
  }

  // 높이만큼 채우되, 넘치면 마지막 한 줄은 "더보기"에 양보.
  const hasMore = tasks.length > maxRows;
  const shown = hasMore ? tasks.slice(0, Math.max(1, maxRows - 1)) : tasks;
  const more = tasks.length - shown.length;

  const slotLabel = i18n.t(`widget.slot.${slot}`);

  return (
    <Card link={WIDGET_LINKS.daily} c={c}>
      <TaskHeader
        c={c}
        soloPet={soloPet}
        multi={multi}
        wide={wide}
        slotTitle={i18n.t('widget.today.slotTasks', { slot: slotLabel })}
        slotLabel={slotLabel}
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
        title={wide && slotLabel ? i18n.t('widget.today.tasksTitleSlot', { slot: slotLabel }) : slotTitle}
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
