import { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import EmptyState from '../../../shared/components/EmptyState';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import RecordCard from '../../record/components/RecordCard';
import RecordCreateSheet from '../../record/components/RecordCreateSheet';
import AppointmentDetailSheet from '../../appointment/components/AppointmentDetailSheet';
import { AppointmentRow } from '../../appointment/components/AppointmentsTab';
import { useAppointments, useDeleteAppointment } from '../../appointment/hooks/useAppointments';
import { useRecords, useAllRecords, useDeleteRecord } from '../../record/hooks/useRecords';
import { usePets } from '../../pet/hooks/usePets';
import { useRefresh } from '../../../shared/hooks/useRefresh';
import { appointmentApi, type Appointment } from '../../appointment/api/appointmentApi';
import { recordApi, type MedicalRecordSummary, type MedicalRecordWithPet } from '../../record/api/recordApi';
import type { Pet } from '../../pet/api/petApi';

const PREVIEW_LIMIT = 5;

/**
 * 진료 통합 탭 — 단일 펫.
 * 다가오는 예약 5개 + 지난 진료기록 5개 미리보기. 각 섹션 헤더에 + 등록, 하단에 "전체보기".
 */
export function MedicalTab({ selectedPetId, topInset = 0 }: { selectedPetId: number; topInset?: number }) {
  const Colors = useColors();
  const [showRecordSheet, setShowRecordSheet] = useState(false);
  const [detail, setDetail] = useState<Appointment | null>(null);

  const { data: appointmentsRaw, isLoading: aptLoading } = useAppointments(selectedPetId);
  const { mutate: deleteAppointment } = useDeleteAppointment(selectedPetId);
  const { data: recordsData, isLoading: recLoading } = useRecords(selectedPetId);
  const { mutate: deleteRecord } = useDeleteRecord(selectedPetId);
  const { refreshing, onRefresh } = useRefresh([
    ['appointments', selectedPetId],
    ['records', selectedPetId],
  ]);

  const appointments = (appointmentsRaw as unknown as Appointment[] | undefined) ?? [];
  const records: MedicalRecordSummary[] = recordsData?.pages.flatMap((p) => p.content) ?? [];

  const upcoming = useMemo(() => {
    const now = Date.now();
    return [...appointments]
      .filter((a) => new Date(a.appointmentAt).getTime() >= now)
      .sort((a, b) => a.appointmentAt.localeCompare(b.appointmentAt));
  }, [appointments]);

  const upcomingPreview = upcoming.slice(0, PREVIEW_LIMIT);
  const recordsPreview = records.slice(0, PREVIEW_LIMIT);

  const handleDeleteAppointment = () => {
    if (!detail) return;
    Alert.alert('예약 삭제', '이 예약을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          const id = detail.id;
          setDetail(null);
          deleteAppointment(id, {
            onError: (e: any) =>
              Alert.alert('삭제 실패', e?.response?.data?.message ?? '잠시 후 다시 시도해주세요.'),
          } as any);
        },
      },
    ]);
  };

  const handleLongPressRecord = (record: MedicalRecordSummary) => {
    Alert.alert('진료기록', record.hospitalName ?? '병원명 없음', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () =>
          deleteRecord(record.id, {
            onError: (e: any) =>
              Alert.alert('삭제 실패', e?.response?.data?.message ?? '잠시 후 다시 시도해주세요.'),
          }),
      },
    ]);
  };

  if (aptLoading && recLoading) {
    return (
      <View style={{ flex: 1, paddingTop: topInset }}>
        <LoadingSpinner label="불러오는 중" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: topInset }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.md,
          paddingBottom: Spacing.xxxxl,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
      >
        <PreviewSectionHeader
          title="다가오는 예약"
          count={upcoming.length}
          onAdd={() =>
            router.push({ pathname: '/appointments/new', params: { petId: String(selectedPetId) } } as any)
          }
          addLabel="예약 추가"
        />
        {upcomingPreview.length === 0 ? (
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, paddingVertical: Spacing.md }}>
            예정된 일정이 없어요
          </Text>
        ) : (
          upcomingPreview.map((a) => (
            <AppointmentRow key={a.id} appointment={a} onPress={() => setDetail(a)} />
          ))
        )}
        {/* 예약은 지난 예약도 풀리스트에 있어서 항상 진입로 노출. */}
        <SeeAllButton
          label="진료일정 전체보기"
          onPress={() => router.push('/appointments/all' as any)}
        />

        <View style={{ height: Spacing.xxl }} />

        <PreviewSectionHeader
          title="지난 진료기록"
          count={records.length}
          onAdd={() => setShowRecordSheet(true)}
          addLabel="기록 추가"
        />
        {recordsPreview.length === 0 ? (
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, paddingVertical: Spacing.md }}>
            아직 진료기록이 없어요
          </Text>
        ) : (
          recordsPreview.map((r) => (
            <RecordCard
              key={r.id}
              record={r}
              onPress={() =>
                router.push({ pathname: '/records/[id]', params: { id: r.id, petId: selectedPetId } })
              }
              onLongPress={() => handleLongPressRecord(r)}
            />
          ))
        )}
        <SeeAllButton
          label="진료기록 전체보기"
          onPress={() => router.push('/records/all' as any)}
        />
      </ScrollView>

      <AppointmentDetailSheet
        appointment={detail}
        onClose={() => setDetail(null)}
        onDelete={handleDeleteAppointment}
      />

      <RecordCreateSheet
        visible={showRecordSheet}
        onClose={() => setShowRecordSheet(false)}
        petId={selectedPetId}
      />
    </View>
  );
}

/**
 * 진료 통합 탭 — 전체 펫. 모든 펫의 일정/기록을 머지해서 미리보기.
 */
export function AllMedicalTab({ topInset = 0 }: { topInset?: number }) {
  const Colors = useColors();
  const queryClient = useQueryClient();
  const [detail, setDetail] = useState<(Appointment & { petName?: string }) | null>(null);

  const { data: petsRaw } = usePets();
  const pets = (petsRaw as unknown as Pet[] | undefined) ?? [];

  const aptQueries = useQueries({
    queries: pets.map((p) => ({
      queryKey: ['appointments', p.id],
      queryFn: () => appointmentApi.list(p.id),
      enabled: !!p.id,
    })),
  });
  const aptLoading = aptQueries.some((q) => q.isLoading);

  const { data: allRecData, isLoading: recLoading } = useAllRecords();
  const allRecords: MedicalRecordWithPet[] = allRecData?.pages.flatMap((p) => p.content) ?? [];

  const allAppointments = useMemo(() => {
    return aptQueries
      .flatMap((q, i) => {
        const list = (q.data as unknown as Appointment[] | undefined) ?? [];
        return list.map((a) => ({ ...a, petName: pets[i]?.name ?? '' }));
      })
      .sort((a, b) => a.appointmentAt.localeCompare(b.appointmentAt));
  }, [aptQueries, pets]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return allAppointments.filter((a) => new Date(a.appointmentAt).getTime() >= now);
  }, [allAppointments]);

  const upcomingPreview = upcoming.slice(0, PREVIEW_LIMIT);
  const recordsPreview = allRecords.slice(0, PREVIEW_LIMIT);

  const handleDeleteAppointment = () => {
    if (!detail) return;
    Alert.alert('예약 삭제', '이 예약을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          const id = detail.id;
          const petId = detail.petId;
          setDetail(null);
          try {
            await appointmentApi.delete(petId, id);
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
          } catch (e: any) {
            Alert.alert('삭제 실패', e?.response?.data?.message ?? '잠시 후 다시 시도해주세요.');
          }
        },
      },
    ]);
  };

  const handleLongPressRecord = (record: MedicalRecordWithPet) => {
    Alert.alert('진료기록', record.hospitalName ?? '병원명 없음', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await recordApi.deleteRecord(record.petId, record.id);
            queryClient.invalidateQueries({ queryKey: ['records'] });
          } catch (e: any) {
            Alert.alert('삭제 실패', e?.response?.data?.message ?? '잠시 후 다시 시도해주세요.');
          }
        },
      },
    ]);
  };

  if (aptLoading && recLoading) {
    return (
      <View style={{ flex: 1, paddingTop: topInset }}>
        <LoadingSpinner label="불러오는 중" />
      </View>
    );
  }

  if (allAppointments.length === 0 && allRecords.length === 0) {
    return (
      <View style={{ flex: 1, paddingTop: topInset }}>
        <EmptyState icon="heart" title="진료 기록이 아직 없어요" description="펫을 선택하고 첫 기록을 남겨보세요" tone="muted" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: topInset }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.md,
          paddingBottom: Spacing.xxxxl,
        }}
      >
        <PreviewSectionHeader title="다가오는 예약" count={upcoming.length} />
        {upcomingPreview.length === 0 ? (
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, paddingVertical: Spacing.md }}>
            예정된 일정이 없어요
          </Text>
        ) : (
          upcomingPreview.map((a) => (
            <AppointmentRow
              key={`${a.petId}-${a.id}`}
              appointment={a}
              petName={a.petName}
              onPress={() => setDetail(a)}
            />
          ))
        )}
        <SeeAllButton
          label="진료일정 전체보기"
          onPress={() => router.push('/appointments/all' as any)}
        />

        <View style={{ height: Spacing.xxl }} />

        <PreviewSectionHeader title="지난 진료기록" count={allRecords.length} />
        {recordsPreview.length === 0 ? (
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, paddingVertical: Spacing.md }}>
            아직 진료기록이 없어요
          </Text>
        ) : (
          recordsPreview.map((r) => (
            <RecordCard
              key={`${r.petId}-${r.id}`}
              record={r}
              petName={r.petName}
              onPress={() => router.push({ pathname: '/records/[id]', params: { id: r.id, petId: r.petId } })}
              onLongPress={() => handleLongPressRecord(r)}
            />
          ))
        )}
        <SeeAllButton
          label="진료기록 전체보기"
          onPress={() => router.push('/records/all' as any)}
        />
      </ScrollView>

      <AppointmentDetailSheet
        appointment={detail}
        onClose={() => setDetail(null)}
        onDelete={handleDeleteAppointment}
      />
    </View>
  );
}

function PreviewSectionHeader({
  title,
  count,
  onAdd,
  addLabel,
}: {
  title: string;
  count: number;
  onAdd?: () => void;
  addLabel?: string;
}) {
  const Colors = useColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm }}>
        <Text style={{ ...Typography.preset.h3, color: Colors.text.primary }}>{title}</Text>
        <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>{count}</Text>
      </View>
      {onAdd ? (
        <TouchableOpacity
          onPress={onAdd}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.xs,
            borderRadius: Spacing.borderRadius.full,
            backgroundColor: Colors.primaryLight,
          }}
        >
          <Feather name="plus" size={14} color={Colors.primaryDark} />
          <Text
            style={{
              ...Typography.preset.caption,
              color: Colors.primaryDark,
              fontWeight: Typography.weight.semibold,
            }}
          >
            {addLabel ?? '추가'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function SeeAllButton({ label, onPress }: { label: string; onPress: () => void }) {
  const Colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: Spacing.md,
        marginTop: Spacing.sm,
      }}
    >
      <Text style={{ ...Typography.preset.label, color: Colors.primary }}>{label}</Text>
      <Feather name="chevron-right" size={14} color={Colors.primary} />
    </TouchableOpacity>
  );
}
