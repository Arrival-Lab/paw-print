import { useInfiniteQuery, useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { recordApi, type RecordRequest } from '../api/recordApi';
import type { PageResponse } from '../../../shared/api/types';
import type { MedicalRecordSummary } from '../api/recordApi';

export const useRecords = (petId: number) =>
  useInfiniteQuery({
    queryKey: ['records', petId],
    queryFn: ({ pageParam }) =>
      recordApi.getRecords(petId, { page: pageParam as number }) as Promise<PageResponse<MedicalRecordSummary>>,
    initialPageParam: 0,
    getNextPageParam: (lastPage: PageResponse<MedicalRecordSummary>) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    enabled: !!petId,
  });

// "전체" 펫 모드: 각 펫의 첫 페이지를 fan-out 후 visitedAt 내림차순으로 병합.
// MVP라 페이지네이션 없음 — 펫당 최대 50건.
export const useAllRecords = (petIds: number[]) => {
  const queries = useQueries({
    queries: petIds.map((petId) => ({
      queryKey: ['records', petId, 'all-first-page'],
      queryFn: () => recordApi.getRecords(petId, { page: 0, size: 50 }),
      enabled: petIds.length > 0,
    })),
  });

  const records: (MedicalRecordSummary & { petId: number })[] = [];
  queries.forEach((q, idx) => {
    if (!q.data) return;
    const petId = petIds[idx];
    q.data.content.forEach((r: MedicalRecordSummary) => records.push({ ...r, petId }));
  });
  records.sort((a, b) => b.visitedAt.localeCompare(a.visitedAt));

  return {
    records,
    isLoading: queries.some((q) => q.isLoading),
  };
};

export const useRecord = (petId: number, recordId: number) =>
  useQuery({
    queryKey: ['records', petId, recordId],
    queryFn: () => recordApi.getRecord(petId, recordId),
    enabled: !!petId && !!recordId,
  });

export const useCreateRecord = (petId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordRequest) => recordApi.createRecord(petId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['records', petId] }),
  });
};

export const useUpdateRecord = (petId: number, recordId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordRequest) => recordApi.updateRecord(petId, recordId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', petId, recordId] });
      queryClient.invalidateQueries({ queryKey: ['records', petId] });
    },
  });
};

export const useDeleteRecord = (petId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recordId: number) => recordApi.deleteRecord(petId, recordId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['records', petId] }),
  });
};

export const useParseOcr = () =>
  useMutation({
    mutationFn: (imageUri: string) => recordApi.parseOcr(imageUri),
  });
