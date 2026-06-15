import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { pickActiveSlot, SLOT_LABEL } from '../slot';
import { WIDGET_LINKS, type WidgetConfig, type WidgetSnapshot } from '../types';
import { Card, CheckRow, EventRow, Header, HintBody, type Wid } from './parts';

/** 빠른 기록 pill — 카드 내부에서 자체 clickAction 으로 RecordForm 진입. */
function QuickRecordButton({ c }: { c: Wid }) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: WIDGET_LINKS.recordCreate }}
      style={{
        width: 'match_parent',
        height: 34,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.primaryLight,
        borderRadius: 9999,
        marginTop: 10,
      }}
    >
      <TextWidget text="+ 빠른 기록" style={{ fontSize: 12, fontWeight: '700', color: c.primaryDark }} />
    </FlexWidget>
  );
}

/**
 * D — 한눈에 보기 대시보드. 오늘 할 일 + 다음 일정 + 빠른 기록을 한 위젯에. 4×2.
 * 인스턴스 설정(config)에 따라 전체 펫 또는 특정 펫. 영역별 딥링크.
 */
export function DashboardWidget({
  snapshot,
  c,
  config = 'all',
}: {
  snapshot: WidgetSnapshot | null;
  width: number;
  c: Wid;
  config?: WidgetConfig;
}) {
  if (!snapshot || !snapshot.loggedIn) {
    return (
      <Card link={WIDGET_LINKS.home} c={c}>
        <HintBody c={c} title="발자국" sub="로그인하고 우리 아이 케어를 한눈에" />
      </Card>
    );
  }
  if (snapshot.pets.length === 0) {
    return (
      <Card link={WIDGET_LINKS.petNew} c={c}>
        <HintBody c={c} title="반려동물을 등록해주세요" sub="첫 펫을 등록하면 시작할 수 있어요" />
      </Card>
    );
  }

  const selectedPet = config !== 'all' ? snapshot.pets.find((p) => p.id === config) ?? null : null;
  const soloPet = selectedPet ?? (snapshot.pets.length === 1 ? snapshot.pets[0] : null);
  const multi = !soloPet;

  const scopeTasks = selectedPet
    ? snapshot.tasks.filter((t) => t.petId === selectedPet.id)
    : snapshot.tasks;
  const scopeEvents = selectedPet
    ? snapshot.events.filter((e) => e.petName === selectedPet.name)
    : snapshot.events;

  const done = scopeTasks.filter((t) => t.done).length;
  const total = scopeTasks.length;

  const { tasks } = pickActiveSlot(scopeTasks, new Date());
  const topTask = tasks.find((t) => !t.done) ?? tasks[0] ?? null;
  const topEvent = scopeEvents[0] ?? null;
  const taskMeta = topTask
    ? multi
      ? topTask.petName
      : topTask.slot !== 'none'
        ? SLOT_LABEL[topTask.slot]
        : null
    : null;

  return (
    <Card link={WIDGET_LINKS.daily} c={c}>
      <Header
        c={c}
        image={multi ? undefined : soloPet?.image ?? null}
        emoji={multi ? '🐾' : undefined}
        title={multi ? '우리 아이들' : soloPet?.name ?? ''}
        rightText={`오늘 ${done}/${total}`}
        dots={{ done, total }}
      />

      {topTask ? (
        <CheckRow
          c={c}
          name={topTask.name}
          done={topTask.done}
          petImage={multi ? topTask.petImage : undefined}
          meta={taskMeta}
        />
      ) : (
        <TextWidget
          text="오늘 할 일이 없어요"
          style={{ fontSize: 12, fontWeight: '400', color: c.faint, marginTop: 8 }}
        />
      )}

      {topEvent ? (
        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: WIDGET_LINKS.appointments }}
          style={{ width: 'match_parent' }}
        >
          <EventRow
            c={c}
            petName={topEvent.petName}
            title={topEvent.title}
            when={topEvent.when}
            dDay={topEvent.dDay}
            compact
            icon="📅"
          />
        </FlexWidget>
      ) : (
        <TextWidget
          text="예정된 일정이 없어요"
          style={{ fontSize: 12, fontWeight: '400', color: c.faint, marginTop: 8 }}
        />
      )}

      <QuickRecordButton c={c} />
    </Card>
  );
}
