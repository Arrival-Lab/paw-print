import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
