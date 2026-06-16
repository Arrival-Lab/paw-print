import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import i18n from '../../../shared/i18n';
import { interleaveByPet, pickActiveSlot } from '../slot';
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
      <TextWidget text={i18n.t('widget.quickRecord')} style={{ fontSize: 12, fontWeight: '700', color: c.primaryDark }} />
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
  height: number;
  c: Wid;
  config?: WidgetConfig;
}) {
  if (!snapshot || !snapshot.loggedIn) {
    return (
      <Card link={WIDGET_LINKS.home} c={c}>
        <HintBody c={c} title={i18n.t('auth.appName')} sub={i18n.t('widget.dashboard.loginSub')} />
      </Card>
    );
  }
  if (snapshot.pets.length === 0) {
    return (
      <Card link={WIDGET_LINKS.petNew} c={c}>
        <HintBody c={c} title={i18n.t('widget.registerPetTitle')} sub={i18n.t('widget.dashboard.registerSub')} />
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

  const picked = pickActiveSlot(scopeTasks, new Date());
  // 전체 모드면 펫 라운드로빈으로 섞어서 한 펫만 계속 나오지 않게.
  const slotTasks = multi ? interleaveByPet(picked.tasks) : picked.tasks;
  const topTask = slotTasks.find((t) => !t.done) ?? slotTasks[0] ?? null;
  const topEvent = scopeEvents[0] ?? null;
  const taskMeta = topTask
    ? multi
      ? topTask.petName
      : topTask.slot !== 'none'
        ? i18n.t(`widget.slot.${topTask.slot}`)
        : null
    : null;

  return (
    <Card link={WIDGET_LINKS.daily} c={c}>
      <Header
        c={c}
        image={multi ? undefined : soloPet?.image ?? null}
        emoji={multi ? '🐾' : undefined}
        title={multi ? i18n.t('widget.dashboard.allPets') : soloPet?.name ?? ''}
        rightText={i18n.t('widget.todayCount', { done, total })}
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
          text={i18n.t('widget.noTasksTitle')}
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
          text={i18n.t('widget.noEventsTitle')}
          style={{ fontSize: 12, fontWeight: '400', color: c.faint, marginTop: 8 }}
        />
      )}

      <QuickRecordButton c={c} />
    </Card>
  );
}
