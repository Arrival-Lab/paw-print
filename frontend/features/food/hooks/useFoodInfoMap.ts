import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { foodApi } from '../api/foodApi';

export interface PetFoodSummary {
  allergies: string[];
}

/**
 * 여러 펫의 알러지 일괄 조회. Map<petId, PetFoodSummary> 반환.
 * queryKey 는 useFoodInfo 와 동일 (`['food', petId]`) — 캐시 공유.
 * 종별 위험 음식은 사용자가 펫별로 관리하지 않고 /care-guide 페이지에서 안내.
 */
export function useFoodInfoMap(petIds: number[]) {
  const queries = useQueries({
    queries: petIds.map((id) => ({
      queryKey: ['food', id],
      queryFn: () => foodApi.get(id),
      enabled: !!id,
      staleTime: 60_000,
    })),
  });

  return useMemo(() => {
    const m = new Map<number, PetFoodSummary>();
    queries.forEach((q, idx) => {
      const id = petIds[idx];
      if (id == null) return;
      const data = q.data;
      m.set(id, {
        allergies: data?.allergies ?? [],
      });
    });
    return m;
  }, [queries, petIds]);
}
