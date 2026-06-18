import { useMutation, useQuery } from '@tanstack/react-query';
import { hospitalApi } from '../api/hospitalApi';

export function useEmergencyHospitals(lat: number | null, lng: number | null) {
  return useQuery({
    queryKey: ['hospitals-emergency', lat, lng],
    queryFn: () => hospitalApi.findEmergency(lat!, lng!),
    enabled: lat !== null && lng !== null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useNearbyHospitals(lat: number | null, lng: number | null) {
  return useQuery({
    queryKey: ['hospitals-nearby', lat, lng],
    queryFn: () => hospitalApi.findNearby(lat!, lng!),
    enabled: lat !== null && lng !== null,
    staleTime: 5 * 60 * 1000,
  });
}

/** 지역 검색어 → 좌표. 검색바 제출 시 호출하는 일회성 액션이라 mutation 으로 노출. */
export function useGeocode() {
  return useMutation({
    mutationFn: (vars: { query: string; center?: { lat: number; lng: number } }) =>
      hospitalApi.geocode(vars.query, vars.center),
  });
}
