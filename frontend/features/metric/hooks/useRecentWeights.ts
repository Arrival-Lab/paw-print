import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { metricApi } from '../api/metricApi';

export interface RecentWeight {
  value: number;
  unit: string;
}

/**
 * 여러 펫의 최근 체중(WEIGHT) 1개씩 조회.
 * 단위는 펫마다 다름(앵무 g, 강아지 kg 등) — value 만으로는 부정확해서 unit 함께 반환.
 * 결과를 Map<petId, RecentWeight | null> 로 반환.
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
    const m = new Map<number, RecentWeight | null>();
    queries.forEach((q, idx) => {
      const id = petIds[idx];
      if (id == null) return;
      const first = q.data?.content?.[0];
      m.set(id, first ? { value: first.value, unit: first.unit ?? 'kg' } : null);
    });
    return m;
  }, [queries, petIds]);
}
