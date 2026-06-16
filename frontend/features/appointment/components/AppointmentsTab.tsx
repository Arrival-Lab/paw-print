import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import EmptyState from '../../../shared/components/EmptyState';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import AppointmentDetailSheet from './AppointmentDetailSheet';
import { useAppointments, useDeleteAppointment } from '../hooks/useAppointments';
import { usePets } from '../../pet/hooks/usePets';
import { useRefresh } from '../../../shared/hooks/useRefresh';
import { appointmentApi, type Appointment } from '../api/appointmentApi';

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
  const { t } = useTranslation();
  const [detail, setDetail] = useState<Appointment | null>(null);

  const { data: appointmentsRaw, isLoading } = useAppointments(selectedPetId ?? 0);
  const { mutate: deleteAppointment } = useDeleteAppointment(selectedPetId ?? 0);
  const { refreshing, onRefresh } = useRefresh([['appointments', selectedPetId ?? 0]]);

  const appointments = appointmentsRaw ?? [];

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
    Alert.alert(t('home.deleteApptTitle'), t('home.deleteApptBody'), [
      { text: t('action.cancel'), style: 'cancel' },
      {
        text: t('action.delete'),
        style: 'destructive',
        onPress: () => {
          const id = detail.id;
          setDetail(null);
          deleteAppointment(id, {
            onError: (e: any) =>
              Alert.alert(t('common.deleteFailTitle'), e?.response?.data?.message ?? t('common.tryAgainLater')),
          } as any);
        },
      },
    ]);
  };

  if (!selectedPetId) {
    return <EmptyState icon="calendar" title={t('appointment.selectPet')} tone="muted" />;
  }
  if (isLoading) {
    return <LoadingSpinner label={t('common.loading')} />;
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
              {t('appointment.add')}
            </Text>
          </TouchableOpacity>
        </View>

        <SectionLabel label={t('appointment.upcoming')} count={upcoming.length} />
        {upcoming.length === 0 ? (
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, paddingVertical: Spacing.md }}>
            {t('appointment.noUpcoming')}
          </Text>
        ) : (
          upcoming.map((a) => (
            <AppointmentRow key={a.id} appointment={a} onPress={() => setDetail(a)} />
          ))
        )}

        <View style={{ height: Spacing.xl }} />

        <SectionLabel label={t('appointment.past')} count={past.length} />
        {past.length === 0 ? (
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, paddingVertical: Spacing.md }}>
            {t('appointment.noPast')}
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

export function AppointmentRow({
  appointment,
  onPress,
  isPast,
  petName,
}: {
  appointment: Appointment;
  onPress: () => void;
  isPast?: boolean;
  petName?: string;
}) {
  const Colors = useColors();
  const { t } = useTranslation();
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
        <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary }}>{t('pet.monthShort', { month })}</Text>
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
        {petName ? (
          <Text
            style={{
              ...Typography.preset.caption,
              color: Colors.primaryDark,
              fontWeight: Typography.weight.semibold,
            }}
          >
            {petName}
          </Text>
        ) : null}
        <Text
          numberOfLines={1}
          style={{
            ...Typography.preset.body,
            color: Colors.text.primary,
            fontWeight: Typography.weight.semibold,
          }}
        >
          {appointment.hospitalName || appointment.reason || t('appointment.fallbackTitle')}
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
            {t('appointment.recordChip')}
          </Text>
        </View>
      ) : null}
      <Feather name="chevron-right" size={16} color={Colors.text.tertiary} />
    </TouchableOpacity>
  );
}

/**
 * 진료 일정 전체 모드 — 모든 펫의 일정을 한 번에. useQueries 로 펫별 fetch 후 머지.
 * petName 라벨 + 같은 SectionLabel/AppointmentRow 재사용.
 */
export function AllAppointmentsTab({ topInset = 0 }: { topInset?: number }) {
  const Colors = useColors();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [detail, setDetail] = useState<(Appointment & { petName?: string }) | null>(null);

  const { data: petsRaw } = usePets();
  const pets = petsRaw ?? [];

  const queries = useQueries({
    queries: pets.map((p) => ({
      queryKey: ['appointments', p.id],
      queryFn: () => appointmentApi.list(p.id),
      enabled: !!p.id,
    })),
  });
  const isLoading = queries.some((q) => q.isLoading);

  const all = useMemo(() => {
    return queries
      .flatMap((q, i) => {
        const list = q.data ?? [];
        return list.map((a) => ({ ...a, petName: pets[i]?.name ?? '' }));
      })
      .sort((a, b) => a.appointmentAt.localeCompare(b.appointmentAt));
  }, [queries, pets]);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    return {
      upcoming: all.filter((a) => new Date(a.appointmentAt).getTime() >= now),
      past: all.filter((a) => new Date(a.appointmentAt).getTime() < now).reverse(),
    };
  }, [all]);

  const handleDelete = () => {
    if (!detail) return;
    Alert.alert(t('home.deleteApptTitle'), t('home.deleteApptBody'), [
      { text: t('action.cancel'), style: 'cancel' },
      {
        text: t('action.delete'),
        style: 'destructive',
        onPress: async () => {
          const id = detail.id;
          const petId = detail.petId;
          setDetail(null);
          try {
            await appointmentApi.delete(petId, id);
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
          } catch (e: any) {
            Alert.alert(t('common.deleteFailTitle'), e?.response?.data?.message ?? t('common.tryAgainLater'));
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, paddingTop: topInset }}>
        <LoadingSpinner label={t('common.loading')} />
      </View>
    );
  }

  if (all.length === 0) {
    return (
      <View style={{ flex: 1, paddingTop: topInset }}>
        <EmptyState icon="calendar" title={t('appointment.emptyAll')} tone="muted" />
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
        <SectionLabel label={t('appointment.upcoming')} count={upcoming.length} />
        {upcoming.length === 0 ? (
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, paddingVertical: Spacing.md }}>
            {t('appointment.noUpcoming')}
          </Text>
        ) : (
          upcoming.map((a) => (
            <AppointmentRow
              key={`${a.petId}-${a.id}`}
              appointment={a}
              petName={a.petName}
              onPress={() => setDetail(a)}
            />
          ))
        )}

        <View style={{ height: Spacing.xl }} />

        <SectionLabel label={t('appointment.past')} count={past.length} />
        {past.length === 0 ? (
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, paddingVertical: Spacing.md }}>
            {t('appointment.noPast')}
          </Text>
        ) : (
          past.map((a) => (
            <AppointmentRow
              key={`${a.petId}-${a.id}`}
              appointment={a}
              petName={a.petName}
              onPress={() => setDetail(a)}
              isPast
            />
          ))
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
