import type { MapCenter } from '../components/HospitalMapView';

/**
 * 좌표가 한국 범위(본토+제주+인근 도서) 안인지 — 백엔드 HospitalService.isKorea 와 동일한 bbox.
 * 한국이면 Kakao 지도/검색, 아니면 Google 로 라우팅하는 기준.
 */
export function isKorea(lat: number, lng: number): boolean {
  return lat >= 33.0 && lat <= 39.0 && lng >= 124.0 && lng <= 132.0;
}

/** 지도 프로바이더 — 좌표 기준. */
export type MapProvider = 'kakao' | 'google';

export function providerFor(center: MapCenter): MapProvider {
  return isKorea(center.lat, center.lng) ? 'kakao' : 'google';
}
