import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { renderWidget } from './renderWidget';
import { clearConfig, readConfig, readSnapshot, readTheme, rememberWidth } from './widgetStorage';
import { WIDGET_NAMES, type WidgetName } from './types';

/**
 * 헤드리스 위젯 렌더 핸들러. index.ts 에서 registerWidgetTaskHandler 로 등록 (Android 전용).
 * React Query/Zustand 에 접근 불가 — MMKV 스냅샷 + 인스턴스(widgetId)별 설정만 읽어 그린다.
 * OPEN_URI / OPEN_APP clickAction 은 라이브러리가 자체 처리하므로 WIDGET_CLICK 분기 불필요.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  const { widgetName, widgetId, width, height } = props.widgetInfo;
  const name = widgetName as WidgetName;
  if (!WIDGET_NAMES.includes(name)) return;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      rememberWidth(name, width);
      props.renderWidget(
        renderWidget(name, readSnapshot(), width, height, readConfig(widgetId), readTheme(widgetId)),
      );
      break;
    }
    case 'WIDGET_DELETED':
      clearConfig(widgetId);
      break;
    default:
      break;
  }
}
