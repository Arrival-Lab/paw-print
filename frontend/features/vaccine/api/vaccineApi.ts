import client from '../../../shared/api/client';

export type RecurrenceType = 'NONE' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
// VACCINE=건강 탭 백신, RECURRING=일상 탭 정기체크(벼룩약·심장사상충 등).
export type VaccineCategory = 'VACCINE' | 'RECURRING';

export interface Vaccine {
  id: number;
  vaccineName: string;
  vaccinatedAt: string;
  nextVaccineAt: string | null;
  notes: string | null;
  alertEnabled: boolean;
  recurrenceType: RecurrenceType;
  category: VaccineCategory;
  dDay: number | null;
}

export interface VaccineRequest {
  vaccineName: string;
  vaccinatedAt: string;
  nextVaccineAt?: string;
  notes?: string;
  alertEnabled?: boolean;
  recurrenceType?: RecurrenceType;
  category?: VaccineCategory;
}

export interface VaccineWithPet extends Vaccine {
  petId: number;
  petName: string;
}

export const vaccineApi = {
  create: (petId: number, data: VaccineRequest) =>
    client.post<Vaccine>(`/api/pets/${petId}/vaccines`, data),

  getVaccines: (petId: number, category?: VaccineCategory) =>
    client.get<Vaccine[]>(`/api/pets/${petId}/vaccines`, {
      params: category ? { category } : undefined,
    }),

  update: (petId: number, vaccineId: number, data: VaccineRequest) =>
    client.put<Vaccine>(`/api/pets/${petId}/vaccines/${vaccineId}`, data),

  delete: (petId: number, vaccineId: number) =>
    client.delete<void>(`/api/pets/${petId}/vaccines/${vaccineId}`),

  // 모든 펫의 임박 백신·정기약 — 탭 배지·홈 위젯용
  getUpcoming: (withinDays: number = 30) =>
    client.get<VaccineWithPet[]>('/api/vaccines/upcoming', { params: { withinDays } }),
};
