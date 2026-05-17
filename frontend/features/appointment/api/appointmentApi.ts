import client from '../../../shared/api/client';

export interface Appointment {
  id: number;
  petId: number;
  appointmentAt: string;       // ISO datetime
  hospitalName: string | null;
  reason: string | null;
  notes: string | null;
  reminderEnabled: boolean;
}

export interface AppointmentWithPet {
  id: number;
  petId: number;
  petName: string;
  appointmentAt: string;
  hospitalName: string | null;
  reason: string | null;
  reminderEnabled: boolean;
  dDay: number;                 // 음수 = 지남, 0 = 오늘, 양수 = 남은 일수
}

export interface AppointmentRequest {
  appointmentAt: string;       // ISO datetime
  hospitalName?: string;
  reason?: string;
  notes?: string;
  reminderEnabled?: boolean;
}

export const appointmentApi = {
  list: (petId: number) =>
    client.get<Appointment[]>(`/api/pets/${petId}/appointments`),

  month: (petId: number, year: number, month: number) =>
    client.get<Appointment[]>(`/api/pets/${petId}/appointments/month`, { params: { year, month } }),

  upcoming: (withinDays = 30) =>
    client.get<AppointmentWithPet[]>('/api/appointments/upcoming', { params: { withinDays } }),

  create: (petId: number, data: AppointmentRequest) =>
    client.post<Appointment>(`/api/pets/${petId}/appointments`, data),

  update: (petId: number, appointmentId: number, data: AppointmentRequest) =>
    client.put<Appointment>(`/api/pets/${petId}/appointments/${appointmentId}`, data),

  delete: (petId: number, appointmentId: number) =>
    client.delete<void>(`/api/pets/${petId}/appointments/${appointmentId}`),
};
