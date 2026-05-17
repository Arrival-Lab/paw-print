import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shareApi } from '../api/shareApi';

export function useShareMembers(petId: number) {
  return useQuery({
    queryKey: ['share-members', petId],
    queryFn: () => shareApi.getMembers(petId),
    enabled: !!petId,
  });
}

export function useInvite(petId: number) {
  return useMutation({
    mutationFn: () => shareApi.invite(petId),
  });
}

export function useAcceptInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => shareApi.accept(token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pets'] }),
  });
}

export function useAcceptByCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => shareApi.acceptByCode(code),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pets'] }),
  });
}

export function useRemoveMember(petId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: number) => shareApi.removeMember(petId, memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['share-members', petId] }),
  });
}
