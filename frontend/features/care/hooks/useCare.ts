import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { careApi, type CareCheckRequest, type CareItemRequest } from '../api/careApi';

const todayIso = () => new Date().toISOString().split('T')[0];

export function useCareItems(petId: number) {
  return useQuery({
    queryKey: ['care', 'items', petId],
    queryFn: () => careApi.listItems(petId),
    enabled: !!petId,
  });
}

export function useCareDay(petId: number, date: string = todayIso()) {
  return useQuery({
    queryKey: ['care', 'day', petId, date],
    queryFn: () => careApi.getDay(petId, date),
    enabled: !!petId,
  });
}

export function useHomeCare(date?: string) {
  return useQuery({
    queryKey: ['care', 'home', date ?? 'today'],
    queryFn: () => careApi.homeToday(date),
    staleTime: 30_000,
  });
}

export function useCreateCareItem(petId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CareItemRequest) => careApi.createItem(petId, data),
    onSuccess: () => invalidateCare(qc, petId),
  });
}

export function useUpdateCareItem(petId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: CareItemRequest }) =>
      careApi.updateItem(petId, itemId, data),
    onSuccess: () => invalidateCare(qc, petId),
  });
}

export function useDeleteCareItem(petId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number) => careApi.deleteItem(petId, itemId),
    onSuccess: () => invalidateCare(qc, petId),
  });
}

export function useSetCareCheck(petId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: CareCheckRequest }) =>
      careApi.setCheck(petId, itemId, data),
    onSuccess: () => invalidateCare(qc, petId),
  });
}

function invalidateCare(qc: ReturnType<typeof useQueryClient>, petId: number) {
  qc.invalidateQueries({ queryKey: ['care', 'items', petId] });
  qc.invalidateQueries({ queryKey: ['care', 'day', petId] });
  qc.invalidateQueries({ queryKey: ['care', 'home'] });
}
