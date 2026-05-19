import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { metricApi } from '../api/metricApi';

/**
 * 여러 펫의 최근 체중(WEIGHT) 1개씩 조회.
 * 펫별로 size=1, type=WEIGHT 페이지 요청. 결과를 Map<petId, value | null> 로 반환.
 */
export function useRecentWeights(petIds: number[]) {
  const queries = useQueries({
    queries: petIds.map((id) => ({
      queryKey: ['metrics', id, 'WEIGHT', 'recent'],
      queryFn: () => metricApi.getMetrics(id, { type: 'WEIGHT' as const, page: 0, size: 1 }),
      enabled: !!id,
      staleTime: 60_000,
    })),
  });

  return useMemo(() => {
    const m = new Map<number, number | null>();
    queries.forEach((q, idx) => {
      const id = petIds[idx];
      if (id == null) return;
      const first = q.data?.content?.[0];
      m.set(id, first?.value ?? null);
    });
    return m;
  }, [queries, petIds]);
}
