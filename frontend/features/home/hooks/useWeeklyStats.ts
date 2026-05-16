import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { diaryApi } from '../../diary/api/diaryApi';
import { recordApi } from '../../record/api/recordApi';
import { usePets } from '../../pet/hooks/usePets';

export interface WeeklyStats {
  diaryCount: number;
  photoCount: number;
  recordCount: number;
  lastVisitDaysAgo: number | null;
  isLoading: boolean;
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function daysBetween(from: string, to: Date): number {
  const f = new Date(from);
  const diffMs = to.getTime() - f.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function useWeeklyStats(petId: number | null): WeeklyStats {
  const { data: pets } = usePets();
  const targetPets = useMemo(
    () => (petId == null ? pets ?? [] : (pets ?? []).filter((p) => p.id === petId)),
    [pets, petId],
  );

  const weekAgo = isoDaysAgo(7);
  const today = isoDaysAgo(0);

  const diaryQueries = useQueries({
    queries: targetPets.map((p) => ({
      queryKey: ['diary-list', p.id, 'week', weekAgo, today],
      queryFn: () => diaryApi.getDiaries(p.id, { from: weekAgo, to: today, size: 50 }),
      staleTime: 60_000,
    })),
  });

  const recordQueries = useQueries({
    queries: targetPets.map((p) => ({
      queryKey: ['records', p.id, 'recent-1'],
      queryFn: () => recordApi.getRecords(p.id, { size: 1 }),
      staleTime: 60_000,
    })),
  });

  return useMemo(() => {
    let diaryCount = 0;
    let photoCount = 0;
    diaryQueries.forEach((q) => {
      q.data?.content?.forEach((d) => {
        diaryCount += 1;
        photoCount += d.photoCount ?? 0;
      });
    });

    let latest: string | null = null;
    let recordCount = 0;
    recordQueries.forEach((q) => {
      const first = q.data?.content?.[0];
      if (first?.visitedAt) {
        if (!latest || first.visitedAt > latest) latest = first.visitedAt;
      }
      if (q.data?.totalElements != null) recordCount += q.data.totalElements;
    });

    const isLoading =
      diaryQueries.some((q) => q.isLoading) || recordQueries.some((q) => q.isLoading);

    return {
      diaryCount,
      photoCount,
      recordCount,
      lastVisitDaysAgo: latest ? daysBetween(latest, new Date()) : null,
      isLoading,
    };
  }, [diaryQueries, recordQueries]);
}
