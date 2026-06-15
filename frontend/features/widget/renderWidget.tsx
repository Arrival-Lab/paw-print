import React from 'react';
import type { WidgetRepresentation } from 'react-native-android-widget';
import { DashboardWidget } from './widgets/DashboardWidget';
import { NextEventsWidget } from './widgets/NextEventsWidget';
import { TodayTasksWidget } from './widgets/TodayTasksWidget';
import { darkWid, lightWid } from './widgets/parts';
import type { WidgetConfig, WidgetName, WidgetSnapshot } from './types';

/**
 * 위젯 이름 → JSX. light/dark 두 벌을 반환해 시스템 다크모드가 자동 선택하게 한다.
 * 헤드리스 핸들러와 앱 갱신 양쪽에서 공유.
 */
export function renderWidget(
  name: WidgetName,
  snapshot: WidgetSnapshot | null,
  width: number,
  config: WidgetConfig,
): WidgetRepresentation {
  switch (name) {
    case 'TodayTasks':
      return {
        light: <TodayTasksWidget snapshot={snapshot} width={width} config={config} c={lightWid} />,
        dark: <TodayTasksWidget snapshot={snapshot} width={width} config={config} c={darkWid} />,
      };
    case 'NextEvents':
      return {
        light: <NextEventsWidget snapshot={snapshot} width={width} c={lightWid} />,
        dark: <NextEventsWidget snapshot={snapshot} width={width} c={darkWid} />,
      };
    case 'Dashboard':
      return {
        light: <DashboardWidget snapshot={snapshot} width={width} config={config} c={lightWid} />,
        dark: <DashboardWidget snapshot={snapshot} width={width} config={config} c={darkWid} />,
      };
  }
}
