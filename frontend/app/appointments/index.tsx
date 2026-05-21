import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Spacing, Typography } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import ScreenHeader from '../../shared/components/ScreenHeader';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import PetSelector from '../../features/pet/components/PetSelector';
import AppointmentDetailSheet from '../../features/appointment/components/AppointmentDetailSheet';
import {
  useAppointments,
  useDeleteAppointment,
} from '../../features/appointment/hooks/useAppointments';
import { useRefresh } from '../../shared/hooks/useRefresh';
import type { Appointment } from '../../features/appointment/api/appointmentApi';

/**
 * 진료 일정 전용 화면 — dearmi ScheduleTab 패턴.
 * - PetSelector 로 펫 전환
 * - 다가오는 예약 / 지난 예약 두 섹션으로 분리
 * - 각 row 탭 시 AppointmentDetailSheet (진료 탭·홈과 공통 컴포넌트)
 */
export default function AppointmentsScreen() {
  const Colors = useColors();
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Appointment | null>(null);

  const { data: appointmentsRaw, isLoading } = useAppointments(selectedPetId ?? 0);
  const { mutate: deleteAppointment } = useDeleteAppointment(selectedPetId ?? 0);
  const { refreshing, onRefresh } = useRefresh([
    ['appointments', selectedPetId ?? 0],
  ]);

  // axios 응답 추론 우회 — 런타임은 unwrap 된 배열.
  const appointments = (appointmentsRaw as unknown as Appointment[] | undefined) ?? [];

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const sorted = [...appointments].sort((a, b) =>
      a.appointmentAt.localeCompare(b.appointmentAt),
    );
    return {
      upcoming: sorted.filter((a) => new Date(a.appointmentAt).getTime() >= now),
      // 과거는 최신순 (역순)
      past: sorted
        .filter((a) => new Date(a.appointmentAt).getTime() < now)
        .reverse(),
    };
  }, [appointments]);

  const handleDelete = () => {
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader
        title="진료 일정"
        back
        actions={[
          {
            icon: 'plus',
            label: '예약 추가',
            onPress: () =>
              selectedPetId
                ? router.push({ pathname: '/appointments/new', params: { petId: String(selectedPetId) } } as any)
                : Alert.alert('펫 선택', '예약을 추가할 반려동물을 먼저 선택해주세요.'),
          },
        ]}
      />

      <View style={{ paddingVertical: Spacing.sm }}>
        <PetSelector onPetChange={setSelectedPetId} />
      </View>

      {!selectedPetId ? (
        <EmptyState icon="calendar" title="반려동물을 선택해주세요" tone="muted" />
      ) : isLoading ? (
        <LoadingSpinner label="불러오는 중" />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxxl }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          <SectionLabel label="다가오는 예약" count={upcoming.length} />
          {upcoming.length === 0 ? (
            <Text
              style={{
                ...Typography.preset.caption,
                color: Colors.text.tertiary,
                paddingVertical: Spacing.md,
              }}
            >
              예정된 일정이 없어요
            </Text>
          ) : (
            upcoming.map((a) => (
              <AppointmentRow key={a.id} appointment={a} onPress={() => setDetail(a)} />
            ))
          )}

          <View style={{ height: Spacing.xl }} />

          <SectionLabel label="지난 예약" count={past.length} />
          {past.length === 0 ? (
            <Text
              style={{
                ...Typography.preset.caption,
                color: Colors.text.tertiary,
                paddingVertical: Spacing.md,
              }}
            >
              지난 일정이 없어요
            </Text>
          ) : (
            past.map((a) => (
              <AppointmentRow key={a.id} appointment={a} onPress={() => setDetail(a)} isPast />
            ))
          )}
        </ScrollView>
      )}

      <AppointmentDetailSheet
        appointment={detail}
        onClose={() => setDetail(null)}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  );
}

function SectionLabel({ label, count }: { label: string; count: number }) {
  const Colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm, marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
      <Text style={{ ...Typography.preset.h3, color: Colors.text.primary }}>{label}</Text>
      <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>{count}</Text>
    </View>
  );
}

function AppointmentRow({
  appointment,
  onPress,
  isPast,
}: {
  appointment: Appointment;
  onPress: () => void;
  isPast?: boolean;
}) {
  const Colors = useColors();
  const d = new Date(appointment.appointmentAt);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        paddingVertical: Spacing.md,
        opacity: isPast ? 0.7 : 1,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
      }}
    >
      <View style={{ alignItems: 'center', minWidth: 40 }}>
        <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary }}>{month}월</Text>
        <Text
          style={{
            ...Typography.preset.h2,
            color: isPast ? Colors.text.secondary : Colors.text.primary,
            fontWeight: Typography.weight.bold,
          }}
        >
          {day}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={{
            ...Typography.preset.body,
            color: Colors.text.primary,
            fontWeight: Typography.weight.semibold,
          }}
        >
          {appointment.hospitalName || appointment.reason || '병원 예약'}
        </Text>
        <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
          {time}
          {appointment.reason && appointment.hospitalName ? ` · ${appointment.reason}` : ''}
        </Text>
      </View>
      {appointment.linkedRecordId ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: Spacing.sm,
            paddingVertical: 2,
            borderRadius: Spacing.borderRadius.sm,
            backgroundColor: Colors.primaryLight,
          }}
        >
          <Feather name="file-text" size={10} color={Colors.primaryDark} />
          <Text style={{ ...Typography.preset.caption, color: Colors.primaryDark, fontWeight: Typography.weight.semibold }}>
            기록
          </Text>
        </View>
      ) : null}
      <Feather name="chevron-right" size={16} color={Colors.text.tertiary} />
    </TouchableOpacity>
  );
}
