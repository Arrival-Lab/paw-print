import { useQueries } from '@tanstack/react-query';
import { vaccineApi, type Vaccine } from '../api/vaccineApi';
import { usePets } from '../../pet/hooks/usePets';

/**
 * 모든 펫의 임박 백신 수 — 탭 배지·홈 카운터 등 글로벌 지표용.
 * 기준: dDay 가 0 이상 7 이하 (이미 지난 건 제외, 1주 이내만).
 */
export function useUpcomingVaccinesCount(): number {
  const { data: pets } = usePets();
  const queries = useQueries({
    queries: (pets ?? []).map((p) => ({
      queryKey: ['vaccines', p.id],
      queryFn: () => vaccineApi.getVaccines(p.id),
      enabled: !!pets?.length,
      staleTime: 60_000,
    })),
  });

  let count = 0;
  queries.forEach((q) => {
    const data = (q.data ?? []) as Vaccine[];
    data.forEach((v) => {
      if (v.dDay !== null && v.dDay >= 0 && v.dDay <= 7) count += 1;
    });
  });
  return count;
}
