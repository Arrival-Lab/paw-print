import React, { useMemo } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DiaryEditor from '../../features/diary/components/DiaryEditor';
import { diaryApi } from '../../features/diary/api/diaryApi';
import { useColors } from '../../shared/hooks/useTheme';
import { useAuthStore } from '../../features/auth/store/authStore';
import ScreenHeader from '../../shared/components/ScreenHeader';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { formatDate } from '../../shared/utils/format';

export default function DiaryDetailScreen() {
  const Colors = useColors();
  const { date, petId, petIds } = useLocalSearchParams<{
    date: string;
    petId?: string;
    petIds?: string;
  }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const petIdList: number[] = useMemo(() => {
    const raw = petIds ?? petId;
    if (!raw) return [];
    return String(raw)
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
  }, [petIds, petId]);

  const isMulti = petIdList.length > 1;
  const singlePetId = isMulti ? 0 : petIdList[0] ?? 0;

  const { data: diaries, isLoading } = useQuery({
    queryKey: ['diary', singlePetId, date],
    queryFn: () => diaryApi.getDiaries(singlePetId, { from: date, to: date }),
    enabled: !isMulti && singlePetId > 0,
  });

  const existing = diaries?.content?.[0];

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: async (data: { content: string; tags: string[] }) => {
      if (isMulti) {
        await Promise.all(
          petIdList.map((pid) =>
            diaryApi.createOrUpdate(pid, { diaryDate: date, ...data }),
          ),
        );
        return null;
      }
      return existing
        ? diaryApi.updateDiary(singlePetId, existing.id, { diaryDate: date, ...data })
        : diaryApi.createOrUpdate(singlePetId, { diaryDate: date, ...data });
    },
    onSuccess: () => {
      petIdList.forEach((pid) => {
        queryClient.invalidateQueries({ queryKey: ['diary', pid] });
        queryClient.invalidateQueries({ queryKey: ['diary-calendar', pid] });
      });
      queryClient.invalidateQueries({ queryKey: ['diary-calendar-all'] });
      router.back();
    },
    onError: () => Alert.alert('저장 실패', '다시 시도해주세요.'),
  });

  const handleAddPhoto = !isMulti && existing
    ? async (uri: string) => {
        try {
          await diaryApi.addPhoto(singlePetId, existing.id, uri);
          queryClient.invalidateQueries({ queryKey: ['diary', singlePetId, date] });
        } catch {
          Alert.alert('사진 업로드 실패', '다시 시도해주세요.');
        }
      }
    : undefined;

  const handleDeletePhoto = !isMulti && existing
    ? async (photoId: number) => {
        try {
          await diaryApi.deletePhoto(singlePetId, existing.id, photoId);
          queryClient.invalidateQueries({ queryKey: ['diary', singlePetId, date] });
        } catch {
          Alert.alert('사진 삭제 실패', '다시 시도해주세요.');
        }
      }
    : undefined;

  const headerTitle = isMulti ? `펫 다이어리 · ${petIdList.length}마리` : '펫 다이어리';
  const headerSubtitle = date ? formatDate(date, 'yyyy년 MM월 dd일') : undefined;

  if (!isMulti && isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
        <ScreenHeader title={headerTitle} subtitle={headerSubtitle} back />
        <LoadingSpinner label="불러오는 중" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader title={headerTitle} subtitle={headerSubtitle} back />
      <DiaryEditor
        date={date}
        initialContent={existing?.content ?? ''}
        initialTags={existing?.tags ?? []}
        photos={!isMulti && diaries?.content?.[0] ? (diaries.content[0] as any).photos ?? [] : []}
        subscriptionType={user?.subscriptionType ?? 'FREE'}
        isSaving={isSaving}
        onSave={save}
        onAddPhoto={handleAddPhoto}
        onDeletePhoto={handleDeletePhoto}
        hidePhotos={isMulti}
        multiPetNote={isMulti ? `같은 내용으로 ${petIdList.length}마리에 저장돼요. 사진은 저장 후 펫별로 추가해주세요.` : undefined}
      />
    </SafeAreaView>
  );
}
