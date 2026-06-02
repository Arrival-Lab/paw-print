import client from '../../../shared/api/client';

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  distance: number;
  /** 카카오맵 장소 상세 페이지 — 진료시간/실시간 영업 여부 확인용. */
  placeUrl?: string | null;
}

/** 지역/장소 검색어를 좌표로 변환한 결과. */
export interface GeocodeResult {
  lat: number;
  lng: number;
  /** 매칭된 장소/주소 표시명 (예: "강남역", "부산광역시"). */
  label: string;
}

export const hospitalApi = {
  findEmergency: (lat: number, lng: number, radius = 5000) =>
    client.get<Hospital[]>('/api/hospitals/emergency', { params: { lat, lng, radius } }),

  findNearby: (lat: number, lng: number, radius = 3000) =>
    client.get<Hospital[]>('/api/hospitals/nearby', { params: { lat, lng, radius } }),

  /** 지역 검색어 → 좌표. 매칭 없으면 404. */
  geocode: (query: string) =>
    client.get<GeocodeResult>('/api/hospitals/geocode', { params: { query } }),
};
