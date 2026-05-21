import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import EmptyState from '../../../shared/components/EmptyState';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import AppointmentDetailSheet from './AppointmentDetailSheet';
import { useAppointments, useDeleteAppointment } from '../hooks/useAppointments';
import { useRefresh } from '../../../shared/hooks/useRefresh';
import type { Appointment } from '../api/appointmentApi';

interface Props {
  selectedPetId: number | null;
  topInset?: number;
}

/**
 * 진료 일정 sub-tab.
 * - 다가오는 예약 / 지난 예약 두 섹션
 * - row 탭 시 공통 AppointmentDetailSheet
 * - records 탭의 sub-tab 으로 사용. 외부 PetSelector 가 selectedPetId 제어.
 */
export function AppointmentsTab({ selectedPetId, topInset = 0 }: Props) {
  const Colors = useColors();
  const [detail, setDetail] = useState<Appointment | null>(null);

  const { data: appointmentsRaw, isLoading } = useAppointments(selectedPetId ?? 0);
  const { mutate: deleteAppointment } = useDeleteAppointment(selectedPetId ?? 0);
  const { refreshing, onRefresh } = useRefresh([['appointments', selectedPetId ?? 0]]);

  const appointments = (appointmentsRaw as unknown as Appointment[] | undefined) ?? [];

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const sorted = [...appointments].sort((a, b) => a.appointmentAt.localeCompare(b.appointmentAt));
    return {
      upcoming: sorted.filter((a) => new Date(a.appointmentAt).getTime() >= now),
      past: sorted.filter((a) => new Date(a.appointmentAt).getTime() < now).reverse(),
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

  if (!selectedPetId) {
    return <EmptyState icon="calendar" title="반려동물을 선택해주세요" tone="muted" />;
  }
  if (isLoading) {
    return <LoadingSpinner label="불러오는 중" />;
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
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: Spacing.md }}>
          <TouchableOpacity
            onPress={() =>
              router.push({ pathname: '/appointments/new', params: { petId: String(selectedPetId) } } as any)
            }
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
              예약 추가
            </Text>
          </TouchableOpacity>
        </View>

        <SectionLabel label="다가오는 예약" count={upcoming.length} />
        {upcoming.length === 0 ? (
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, paddingVertical: Spacing.md }}>
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
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, paddingVertical: Spacing.md }}>
            지난 일정이 없어요
          </Text>
        ) : (
          past.map((a) => <AppointmentRow key={a.id} appointment={a} onPress={() => setDetail(a)} isPast />)
        )}
      </ScrollView>

      <AppointmentDetailSheet
        appointment={detail}
        onClose={() => setDetail(null)}
        onDelete={handleDelete}
      />
    </View>
  );
}

function SectionLabel({ label, count }: { label: string; count: number }) {
  const Colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm, marginBottom: Spacing.sm }}>
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
