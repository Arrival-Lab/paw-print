import { getWidgetInfo, requestWidgetUpdateById } from 'react-native-android-widget';
import { renderWidget } from './renderWidget';
import { readConfig, writeSnapshot } from './widgetStorage';
import { WIDGET_NAMES, type WidgetSnapshot } from './types';

/**
 * 스냅샷 저장 + 설치된 모든 위젯 인스턴스를 각자의 설정(전체/펫지정)·폭으로 갱신.
 * requestWidgetUpdate 는 같은 이름 인스턴스에 동일 렌더를 적용하므로, 인스턴스별 설정이
 * 다른 우리 케이스에선 getWidgetInfo + requestWidgetUpdateById 로 개별 갱신해야 한다.
 * Android 에서만 호출할 것.
 */
export async function updateAllWidgets(snapshot: WidgetSnapshot): Promise<void> {
  writeSnapshot(snapshot);
  for (const name of WIDGET_NAMES) {
    const instances = await getWidgetInfo(name);
    for (const info of instances) {
      requestWidgetUpdateById({
        widgetName: name,
        widgetId: info.widgetId,
        renderWidget: (i) => renderWidget(name, snapshot, i.width, readConfig(i.widgetId)),
        widgetNotFound: () => {
          /* 인스턴스 제거됨 — 무시 */
        },
      });
    }
  }
}
