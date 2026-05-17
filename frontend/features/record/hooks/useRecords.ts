import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recordApi, type RecordRequest } from '../api/recordApi';
import type { PageResponse } from '../../../shared/api/types';
import type { MedicalRecordSummary, MedicalRecordWithPet } from '../api/recordApi';

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

/** "전체" 모드 — 백엔드가 모든 펫 진료기록을 visitedAt 내림차순으로 페이지네이션해서 반환. */
export const useAllRecords = () =>
  useInfiniteQuery({
    queryKey: ['records', 'all'],
    queryFn: ({ pageParam }) =>
      recordApi.getAllRecords({ page: pageParam as number, size: 20 }) as Promise<PageResponse<MedicalRecordWithPet>>,
    initialPageParam: 0,
    getNextPageParam: (lastPage: PageResponse<MedicalRecordWithPet>) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
  });

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

export const useParseOcr = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageUri: string) => recordApi.parseOcr(imageUri),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usage'] }),
  });
};
