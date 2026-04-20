import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { petApi, type PetRequest } from '../api/petApi';

export const usePets = () =>
  useQuery({
    queryKey: ['pets'],
    queryFn: () => petApi.getPets(),
  });

export const usePet = (petId: number) =>
  useQuery({
    queryKey: ['pets', petId],
    queryFn: () => petApi.getPet(petId),
    enabled: !!petId,
  });

export const useCreatePet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PetRequest) => petApi.createPet(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pets'] }),
  });
};

export const useUpdatePet = (petId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PetRequest) => petApi.updatePet(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets', petId] });
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });
};

export const useDeletePet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (petId: number) => petApi.deletePet(petId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pets'] }),
  });
};

export const useUploadPetProfileImage = (petId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uri: string) => petApi.uploadProfileImage(petId, uri),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets', petId] });
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });
};
