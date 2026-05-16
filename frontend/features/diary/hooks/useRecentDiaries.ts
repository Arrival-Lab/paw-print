import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { diaryApi, type DiarySummary } from '../api/diaryApi';
import { usePets } from '../../pet/hooks/usePets';

export interface RecentDiary extends DiarySummary {
  petId: number;
  petName: string;
}

export interface UseRecentDiariesOptions {
  limit?: number;
  from?: string;
  to?: string;
}

/**
 * petId 지정 시 그 펫만, null 이면 모든 펫의 다이어리를 머지해서 최근 N개 반환.
 * 펫별로 최근 limit*2 건씩 가져와 클라에서 날짜 desc 정렬 후 limit 슬라이스.
 */
export function useRecentDiaries(
  petId: number | null,
  options: UseRecentDiariesOptions = {},
) {
  const { limit = 6, from, to } = options;
  const { data: pets } = usePets();
  const targetPets = useMemo(
    () => (petId == null ? pets ?? [] : (pets ?? []).filter((p) => p.id === petId)),
    [pets, petId],
  );

  const queries = useQueries({
    queries: targetPets.map((p) => ({
      queryKey: ['diary-list', p.id, 'recent', from ?? 'none', to ?? 'none', limit],
      queryFn: () => diaryApi.getDiaries(p.id, { size: limit * 2, from, to }),
      enabled: !!p.id,
      staleTime: 60_000,
    })),
  });

  return useMemo(() => {
    const merged: RecentDiary[] = [];
    queries.forEach((q, idx) => {
      const pet = targetPets[idx];
      if (!pet || !q.data?.content) return;
      q.data.content.forEach((d) =>
        merged.push({ ...d, petId: pet.id, petName: pet.name }),
      );
    });
    merged.sort((a, b) => String(b.diaryDate).localeCompare(String(a.diaryDate)));
    const isLoading = queries.some((q) => q.isLoading);
    return { data: merged.slice(0, limit), isLoading };
  }, [queries, targetPets, limit]);
}
