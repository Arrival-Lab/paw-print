import { DevSettings, Platform } from 'react-native';
import i18n from '../i18n';

/**
 * 앱 JS bundle 재시작 — 테마 변경처럼 일부 컴포넌트가 native 단계에서만 잡혀
 * 핫리로드 안 되는 변경을 깔끔히 적용하기 위해 사용.
 *
 * 우선순위:
 *  1. expo-updates 의 Updates.reloadAsync() — prod·dev 모두 동작 (가장 안정)
 *  2. RN DevSettings.reload()                 — dev 빌드 fallback
 *  3. 둘 다 실패하면 throw — 호출부가 "수동 재시작" 안내 띄움
 *
 * expo-updates 미설치 환경에서도 빌드 깨지지 않도록 variable string require 로 우회.
 */
export async function reloadApp(): Promise<void> {
  // 1) expo-updates 시도
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const moduleId = 'expo-updates';
    const Updates = require(moduleId);
    if (Updates?.reloadAsync) {
      await Updates.reloadAsync();
      return;
    }
  } catch {
    /* expo-updates 미설치 — fallback */
  }

  // 2) DevSettings.reload — dev client 에서만 동작
  if (typeof (DevSettings as any)?.reload === 'function') {
    try {
      (DevSettings as any).reload();
      return;
    } catch {
      /* ignore */
    }
  }

  // 3) 둘 다 실패
  throw new Error(
    Platform.select({
      ios: i18n.t('common.reloadManual'),
      android: i18n.t('common.reloadManual'),
      default: i18n.t('common.reloadRestart'),
    })!,
  );
}
