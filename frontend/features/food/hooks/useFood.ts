import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { foodApi, FoodInfoRequest } from '../api/foodApi';

export function useFoodInfo(petId: number) {
  return useQuery({
    queryKey: ['food', petId],
    queryFn: () => foodApi.get(petId),
    enabled: !!petId,
  });
}

export function useUpsertFood(petId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FoodInfoRequest) => foodApi.upsert(petId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['food', petId] }),
  });
}
