import React from 'react';
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
  const { date, petId } = useLocalSearchParams<{ date: string; petId: string }>();
  const petIdNum = Number(petId);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: diaries, isLoading } = useQuery({
    queryKey: ['diary', petIdNum, date],
    queryFn: () => diaryApi.getDiaries(petIdNum, { from: date, to: date }),
    enabled: petIdNum > 0,
  });

  const existing = diaries?.content?.[0];

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (data: { content: string; tags: string[] }) =>
      existing
        ? diaryApi.updateDiary(petIdNum, existing.id, { diaryDate: date, ...data })
        : diaryApi.createOrUpdate(petIdNum, { diaryDate: date, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diary', petIdNum] });
      queryClient.invalidateQueries({ queryKey: ['diary-calendar', petIdNum] });
      router.back();
    },
    onError: () => Alert.alert('저장 실패', '다시 시도해주세요.'),
  });

  const handleAddPhoto = existing
    ? async (uri: string) => {
        try {
          await diaryApi.addPhoto(petIdNum, existing.id, uri);
          queryClient.invalidateQueries({ queryKey: ['diary', petIdNum, date] });
        } catch {
          Alert.alert('사진 업로드 실패', '다시 시도해주세요.');
        }
      }
    : undefined;

  const handleDeletePhoto = existing
    ? async (photoId: number) => {
        try {
          await diaryApi.deletePhoto(petIdNum, existing.id, photoId);
          queryClient.invalidateQueries({ queryKey: ['diary', petIdNum, date] });
        } catch {
          Alert.alert('사진 삭제 실패', '다시 시도해주세요.');
        }
      }
    : undefined;

  const headerTitle = '펫 다이어리';
  const headerSubtitle = date ? formatDate(date, 'yyyy년 MM월 dd일') : undefined;

  if (isLoading) {
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
        photos={diaries?.content?.[0] ? (diaries.content[0] as any).photos ?? [] : []}
        subscriptionType={user?.subscriptionType ?? 'FREE'}
        isSaving={isSaving}
        onSave={save}
        onAddPhoto={handleAddPhoto}
        onDeletePhoto={handleDeletePhoto}
      />
    </SafeAreaView>
  );
}
