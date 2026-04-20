import { useQuery } from '@tanstack/react-query';
import { hospitalApi } from '../api/hospitalApi';

export function useEmergencyHospitals(lat: number | null, lng: number | null) {
  return useQuery({
    queryKey: ['hospitals-emergency', lat, lng],
    queryFn: () => hospitalApi.findEmergency(lat!, lng!),
    enabled: lat !== null && lng !== null,
    staleTime: 5 * 60 * 1000,
  });
}
