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

export const hospitalApi = {
  findEmergency: (lat: number, lng: number, radius = 5000) =>
    client.get<Hospital[]>('/api/hospitals/emergency', { params: { lat, lng, radius } }),

  findNearby: (lat: number, lng: number, radius = 3000) =>
    client.get<Hospital[]>('/api/hospitals/nearby', { params: { lat, lng, radius } }),
};
