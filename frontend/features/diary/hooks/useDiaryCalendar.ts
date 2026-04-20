import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { diaryApi, type DiaryRequest } from '../api/diaryApi';

export const useDiaryCalendar = (petId: number, year: number, month: number) =>
  useQuery({
    queryKey: ['diary-calendar', petId, year, month],
    queryFn: () => diaryApi.getCalendar(petId, year, month),
    enabled: !!petId,
  });

export const useDiary = (petId: number, diaryId: number) =>
  useQuery({
    queryKey: ['diary', petId, diaryId],
    queryFn: () => diaryApi.getDiary(petId, diaryId),
    enabled: !!petId && !!diaryId,
  });

export const useCreateOrUpdateDiary = (petId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DiaryRequest) => diaryApi.createOrUpdate(petId, data),
    onSuccess: (_, variables) => {
      const date = new Date(variables.diaryDate);
      queryClient.invalidateQueries({
        queryKey: ['diary-calendar', petId, date.getFullYear(), date.getMonth() + 1],
      });
    },
  });
};

export const useAddDiaryPhoto = (petId: number, diaryId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uri: string) => diaryApi.addPhoto(petId, diaryId, uri),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diary', petId, diaryId] }),
  });
};

export const useDeleteDiaryPhoto = (petId: number, diaryId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: number) => diaryApi.deletePhoto(petId, diaryId, photoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diary', petId, diaryId] }),
  });
};
