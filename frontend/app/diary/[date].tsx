import React from 'react';
import { View, Text, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import DiaryEditor from '../../features/diary/components/DiaryEditor';
import { diaryApi } from '../../features/diary/api/diaryApi';
import { Colors, Spacing, Typography } from '../../constants';
import { useAuthStore } from '../../features/auth/store/authStore';

export default function DiaryDetailScreen() {
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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: Spacing.md }}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>
          건강 다이어리
        </Text>
      </View>

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
