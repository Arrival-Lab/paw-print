import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vaccineApi, VaccineRequest, VaccineCategory } from '../api/vaccineApi';

export function useVaccines(petId: number, category?: VaccineCategory) {
  return useQuery({
    queryKey: ['vaccines', petId, category],
    queryFn: () => vaccineApi.getVaccines(petId, category),
    enabled: !!petId,
  });
}

export function useCreateVaccine(petId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VaccineRequest) => vaccineApi.create(petId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vaccines', petId] }),
  });
}

export function useUpdateVaccine(petId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vaccineId, data }: { vaccineId: number; data: VaccineRequest }) =>
      vaccineApi.update(petId, vaccineId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vaccines', petId] }),
  });
}

export function useDeleteVaccine(petId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vaccineId: number) => vaccineApi.delete(petId, vaccineId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vaccines', petId] }),
  });
}
