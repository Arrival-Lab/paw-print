import React, { useMemo, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DiaryEditor from '../../features/diary/components/DiaryEditor';
import DiaryReadView from '../../features/diary/components/DiaryReadView';
import QuickMetricChips from '../../features/metric/components/QuickMetricChips';
import { diaryApi } from '../../features/diary/api/diaryApi';
import { useColors } from '../../shared/hooks/useTheme';
import { useAuthStore } from '../../features/auth/store/authStore';
import { usePets } from '../../features/pet/hooks/usePets';
import ScreenHeader from '../../shared/components/ScreenHeader';
import { useLeaveConfirm } from '../../shared/hooks/useLeaveConfirm';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import Fab from '../../shared/components/Fab';
import { formatDate } from '../../shared/utils/format';

export default function DiaryDetailScreen() {
  const Colors = useColors();
  const { date, petId, petIds, mode: initialMode } = useLocalSearchParams<{
    date: string;
    petId?: string;
    petIds?: string;
    mode?: 'view' | 'edit';
  }>();
  const { data: pets } = usePets();
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

  // list 응답엔 photos 배열이 없음 (photoCount 만). 사진 표시를 위해 detail 한 번 더 호출.
  const { data: detail } = useQuery({
    queryKey: ['diary-detail', singlePetId, existing?.id],
    queryFn: () => diaryApi.getDiary(singlePetId, existing!.id),
    enabled: !isMulti && singlePetId > 0 && !!existing?.id,
  });

  const photos = detail?.photos ?? [];

  // 신규 다이어리 작성 중 선택된 로컬 uri 들 — 저장 시 createOrUpdate 후 일괄 addPhoto.
  const [pendingPhotoUris, setPendingPhotoUris] = useState<string[]>([]);

  // 작성 중 내용 이탈 확인 — DiaryEditor 의 dirty + 추가한 사진 유무.
  const [editorDirty, setEditorDirty] = useState(false);
  const { allowLeave } = useLeaveConfirm(editorDirty || pendingPhotoUris.length > 0);

  // 모드 — query param 우선, 그 다음 다중/기존 여부로 자동 결정
  const [mode, setMode] = useState<'view' | 'edit'>(
    initialMode === 'edit' || initialMode === 'view' ? initialMode : 'view',
  );
  useEffect(() => {
    if (initialMode === 'edit' || initialMode === 'view') return; // 명시 mode면 자동 결정 skip
    if (isMulti) setMode('edit');
    else if (!isLoading && !existing) setMode('edit');
  }, [isMulti, existing, isLoading, initialMode]);

  const pet = useMemo(() => {
    if (isMulti) return undefined;
    return (pets ?? []).find((p) => p.id === singlePetId);
  }, [pets, singlePetId, isMulti]);
  const petName = pet?.name;
  const petSpecies = pet?.species;

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: async (data: { title: string; content: string; tags: string[] }) => {
      if (isMulti) {
        await Promise.all(
          petIdList.map((pid) =>
            diaryApi.createOrUpdate(pid, { diaryDate: date, ...data }),
          ),
        );
        return null;
      }
      if (existing) {
        return diaryApi.updateDiary(singlePetId, existing.id, { diaryDate: date, ...data });
      }
      // 신규: 다이어리 생성 → 받은 id 로 pending 사진들 차례로 업로드.
      const created: any = await diaryApi.createOrUpdate(singlePetId, { diaryDate: date, ...data });
      const newId = created?.id ?? created?.data?.id;
      if (newId && pendingPhotoUris.length > 0) {
        for (const uri of pendingPhotoUris) {
          try {
            await diaryApi.addPhoto(singlePetId, newId, uri);
          } catch (e) {
            if (__DEV__) console.warn('[diary] photo upload failed', uri, e);
          }
        }
      }
      return created;
    },
    onSuccess: () => {
      petIdList.forEach((pid) => {
        queryClient.invalidateQueries({ queryKey: ['diary', pid] });
        queryClient.invalidateQueries({ queryKey: ['diary-calendar', pid] });
        queryClient.invalidateQueries({ queryKey: ['diary-list', pid] });
      });
      queryClient.invalidateQueries({ queryKey: ['diary-calendar-all'] });
      setPendingPhotoUris([]);
      allowLeave(); // 저장 후 이동은 이탈 확인 건너뜀
      router.back();
    },
    onError: () => Alert.alert('저장 실패', '다시 시도해주세요.'),
  });

  const invalidateAfterPhotoChange = () => {
    queryClient.invalidateQueries({ queryKey: ['diary', singlePetId, date] });
    queryClient.invalidateQueries({ queryKey: ['diary-detail', singlePetId, existing?.id] });
    queryClient.invalidateQueries({ queryKey: ['diary-list', singlePetId] });
    queryClient.invalidateQueries({ queryKey: ['diary-calendar', singlePetId] });
    queryClient.invalidateQueries({ queryKey: ['diary-calendar-all'] });
  };

  const handleAddPhoto = !isMulti
    ? async (uri: string) => {
        if (!existing) {
          // 신규 모드 — 다이어리 아직 없음. 저장 시 일괄 업로드 위해 로컬에만 쌓음.
          setPendingPhotoUris((prev) => [...prev, uri]);
          return;
        }
        try {
          await diaryApi.addPhoto(singlePetId, existing.id, uri);
          invalidateAfterPhotoChange();
        } catch (e: any) {
          const msg = e?.response?.data?.message ?? '다시 시도해주세요.';
          Alert.alert('사진 업로드 실패', msg);
        }
      }
    : undefined;

  const handleDeletePhoto = !isMulti && existing
    ? async (photoId: number) => {
        try {
          await diaryApi.deletePhoto(singlePetId, existing.id, photoId);
          invalidateAfterPhotoChange();
        } catch {
          Alert.alert('사진 삭제 실패', '다시 시도해주세요.');
        }
      }
    : undefined;

  const handleRemovePendingPhoto = (uri: string) => {
    setPendingPhotoUris((prev) => prev.filter((u) => u !== uri));
  };

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

  const showReadView = mode === 'view' && !isMulti && existing;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader title={headerTitle} subtitle={headerSubtitle} back />
      {showReadView ? (
        <>
          <DiaryReadView
            date={date}
            title={existing.title ?? null}
            content={existing.content}
            tags={existing.tags ?? []}
            photos={photos}
            petName={petName}
            petSpecies={petSpecies}
            petId={!isMulti ? singlePetId : undefined}
            onEdit={() => setMode('edit')}
          />
          {/* 하단 큰 작성/수정 버튼 — 우상단 작은 연필이 안 보인다는 피드백 반영 (extended FAB). */}
          <Fab icon="edit-3" label="수정" onPress={() => setMode('edit')} accessibilityLabel="다이어리 수정" />
        </>
      ) : (
        <DiaryEditor
          date={date}
          initialTitle={existing?.title ?? ''}
          initialContent={existing?.content ?? ''}
          initialTags={existing?.tags ?? []}
          photos={!isMulti ? photos : []}
          pendingPhotoUris={!isMulti && !existing ? pendingPhotoUris : []}
          subscriptionType={user?.subscriptionType ?? 'FREE'}
          isSaving={isSaving}
          onSave={save}
          onAddPhoto={handleAddPhoto}
          onDeletePhoto={handleDeletePhoto}
          onRemovePendingPhoto={handleRemovePendingPhoto}
          onDirtyChange={setEditorDirty}
          hidePhotos={isMulti}
          multiPetNote={isMulti ? `같은 내용으로 ${petIdList.length}마리에 저장돼요. 사진은 저장 후 펫별로 추가해주세요.` : undefined}
          headerSlot={!isMulti && singlePetId > 0 ? <QuickMetricChips petId={singlePetId} date={date} /> : null}
        />
      )}
    </SafeAreaView>
  );
}
