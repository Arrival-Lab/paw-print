import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { recordApi, type MedicalRecordSummary } from '../api/recordApi';
import type { PageResponse } from '../../../shared/api/types';

/**
 * 특정 펫의 특정 월(year-month)에 진료기록이 있는 날짜 Set 반환.
 * 다이어리 캘린더에서 "그 날 의료기록이 있었나" 를 셀에 핑크 dot 으로 표시할 때 사용.
 * 가벼운 페치 — 한 페이지(최대 50건)로 한 달치는 충분.
 */
export function useRecordsByMonthDates(petId: number | null, year: number, month: number) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data } = useQuery({
    queryKey: ['records-by-month', petId, year, month],
    queryFn: () => recordApi.getRecords(petId!, { from, to, size: 50 }),
    enabled: !!petId,
    staleTime: 60_000,
  });

  return useMemo(() => {
    const set = new Set<string>();
    const page = data as unknown as PageResponse<MedicalRecordSummary> | undefined;
    page?.content.forEach((r) => {
      set.add(r.visitedAt.slice(0, 10));
    });
    return set;
  }, [data]);
}
