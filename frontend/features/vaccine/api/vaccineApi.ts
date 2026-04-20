import client from '../../../shared/api/client';

export interface Vaccine {
  id: number;
  vaccineName: string;
  vaccinatedAt: string;
  nextVaccineAt: string | null;
  notes: string | null;
  alertEnabled: boolean;
  dDay: number | null;
}

export interface VaccineRequest {
  vaccineName: string;
  vaccinatedAt: string;
  nextVaccineAt?: string;
  notes?: string;
  alertEnabled?: boolean;
}

export const vaccineApi = {
  create: (petId: number, data: VaccineRequest) =>
    client.post<Vaccine>(`/api/pets/${petId}/vaccines`, data),

  getVaccines: (petId: number) =>
    client.get<Vaccine[]>(`/api/pets/${petId}/vaccines`),

  update: (petId: number, vaccineId: number, data: VaccineRequest) =>
    client.put<Vaccine>(`/api/pets/${petId}/vaccines/${vaccineId}`, data),

  delete: (petId: number, vaccineId: number) =>
    client.delete<void>(`/api/pets/${petId}/vaccines/${vaccineId}`),
};
