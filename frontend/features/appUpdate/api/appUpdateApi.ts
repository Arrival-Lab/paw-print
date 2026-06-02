import client from '../../../shared/api/client';

export interface AppVersionInfo {
  /** 스토어에 올라간 최신 버전. 설치 버전 < latest → 업데이트 권장. */
  latestVersion: string;
  /** 최소 지원 버전. 설치 버전 < min → 강제 업데이트. */
  minVersion: string;
}

export const appUpdateApi = {
  getVersionInfo: (platform: 'ios' | 'android') =>
    client.get<AppVersionInfo>('/api/app/version', { params: { platform } }),
};
