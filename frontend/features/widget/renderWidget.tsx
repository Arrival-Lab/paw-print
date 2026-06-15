import React from 'react';
import type { WidgetRepresentation } from 'react-native-android-widget';
import { DashboardWidget } from './widgets/DashboardWidget';
import { NextEventsWidget } from './widgets/NextEventsWidget';
import { TodayTasksWidget } from './widgets/TodayTasksWidget';
import { darkWid, lightWid, type Wid } from './widgets/parts';
import type { WidgetConfig, WidgetName, WidgetSnapshot, WidgetTheme } from './types';

function element(
  name: WidgetName,
  snapshot: WidgetSnapshot | null,
  width: number,
  height: number,
  config: WidgetConfig,
  c: Wid,
): React.ReactElement {
  switch (name) {
    case 'NextEvents':
      return <NextEventsWidget snapshot={snapshot} width={width} height={height} c={c} />;
    case 'Dashboard':
      return <DashboardWidget snapshot={snapshot} width={width} height={height} config={config} c={c} />;
    case 'TodayTasks':
    default:
      return <TodayTasksWidget snapshot={snapshot} width={width} height={height} config={config} c={c} />;
  }
}

/**
 * 위젯 이름 → JSX. 테마가 system 이면 light/dark 두 벌(시스템 자동 선택),
 * light/dark 면 해당 한 벌만 반환(시스템 다크여도 강제). 헤드리스 핸들러·앱 갱신 공유.
 */
export function renderWidget(
  name: WidgetName,
  snapshot: WidgetSnapshot | null,
  width: number,
  height: number,
  config: WidgetConfig,
  theme: WidgetTheme = 'system',
): WidgetRepresentation {
  if (theme === 'light') return element(name, snapshot, width, height, config, lightWid);
  if (theme === 'dark') return element(name, snapshot, width, height, config, darkWid);
  return {
    light: element(name, snapshot, width, height, config, lightWid),
    dark: element(name, snapshot, width, height, config, darkWid),
  };
}
