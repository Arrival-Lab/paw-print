import { useQuery } from '@tanstack/react-query';
import { vaccineApi } from '../api/vaccineApi';

/**
 * 모든 펫의 임박 백신 수 — 탭 배지·홈 카운터 용.
 * dDay 0~7일 이내. 백엔드 /api/vaccines/upcoming을 7일로 호출.
 */
export function useUpcomingVaccinesCount(): number {
  const { data } = useQuery({
    queryKey: ['vaccines', 'upcoming', 7],
    queryFn: () => vaccineApi.getUpcoming(7),
    staleTime: 60_000,
  });
  return (data ?? []).length;
}
