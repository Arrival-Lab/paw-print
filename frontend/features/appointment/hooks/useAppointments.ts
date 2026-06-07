import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { appointmentApi, type AppointmentRequest } from '../api/appointmentApi';

export function useAppointments(petId: number) {
  return useQuery({
    queryKey: ['appointments', petId],
    queryFn: () => appointmentApi.list(petId),
    enabled: !!petId,
  });
}

/** 다이어리 캘린더 셀 마커용 — 특정 펫의 월별 예약 날짜 Set. */
export function useAppointmentDates(petId: number | null, year: number, month: number) {
  const { data } = useQuery({
    queryKey: ['appointments', 'month', petId, year, month],
    queryFn: () => appointmentApi.month(petId!, year, month),
    enabled: !!petId,
    staleTime: 60_000,
  });
  return useMemo(() => {
    const set = new Set<string>();
    const list = data ?? [];
    list.forEach((a) => set.add(a.appointmentAt.slice(0, 10)));
    return set;
  }, [data]);
}

/**
 * 전체 모드 캘린더 마커용 — 본인+공유 펫의 월별 예약을 날짜 → petId[] 맵으로.
 * 각 날짜에 어떤 펫의 예약이 있는지 알아야 펫 색 dot 을 그릴 수 있다.
 */
export function useAllPetsAppointmentDates(year: number, month: number, enabled: boolean) {
  const { data } = useQuery({
    queryKey: ['appointments', 'month-all', year, month],
    queryFn: () => appointmentApi.monthAll(year, month),
    enabled,
    staleTime: 60_000,
  });
  return useMemo(() => {
    const map = new Map<string, number[]>();
    (data ?? []).forEach((a) => {
      const date = a.appointmentAt.slice(0, 10);
      const ids = map.get(date) ?? [];
      if (!ids.includes(a.petId)) ids.push(a.petId);
      map.set(date, ids);
    });
    return map;
  }, [data]);
}

/** 홈 위젯 — 본인+공유 펫의 다가오는 예약. */
export function useUpcomingAppointments(withinDays = 30) {
  return useQuery({
    queryKey: ['appointments', 'upcoming', withinDays],
    queryFn: () => appointmentApi.upcoming(withinDays),
    staleTime: 60_000,
  });
}

export function useCreateAppointment(petId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AppointmentRequest) => appointmentApi.create(petId, data),
    onSuccess: () => invalidateAll(qc, petId),
  });
}

export function useUpdateAppointment(petId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AppointmentRequest }) =>
      appointmentApi.update(petId, id, data),
    onSuccess: () => invalidateAll(qc, petId),
  });
}

export function useDeleteAppointment(petId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => appointmentApi.delete(petId, id),
    onSuccess: () => invalidateAll(qc, petId),
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>, petId: number) {
  qc.invalidateQueries({ queryKey: ['appointments', petId] });
  qc.invalidateQueries({ queryKey: ['appointments', 'month', petId] });
  qc.invalidateQueries({ queryKey: ['appointments', 'month-all'] });
  qc.invalidateQueries({ queryKey: ['appointments', 'upcoming'] });
}
