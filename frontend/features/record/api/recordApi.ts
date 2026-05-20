import client from '../../../shared/api/client';
import type { PageResponse } from '../../../shared/api/types';

export interface MedicalRecord {
  id: number;
  visitedAt: string;
  hospitalName: string | null;
  symptoms: string | null;
  diagnosis: string | null;
  treatment: string | null;
  prescription: string | null;
  notes: string | null;
  /** 진료일정에서 만들어진 기록이면 그 appointment id. 독립 기록이면 null. */
  appointmentId: number | null;
  attachments: Attachment[];
}

export interface MedicalRecordSummary {
  id: number;
  visitedAt: string;
  hospitalName: string | null;
  symptoms: string | null;
  appointmentId: number | null;
  attachmentCount: number;
}

export interface Attachment {
  id: number;
  fileUrl: string;
  fileType: 'IMAGE' | 'PDF';
  createdAt: string;
}

export interface RecordRequest {
  visitedAt: string;
  hospitalName?: string;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  notes?: string;
  appointmentId?: number;
}

export interface OcrResult {
  hospitalName: string | null;
  visitedAt: string | null;
  symptoms: string | null;
  diagnosis: string | null;
  treatment: string | null;
  prescription: string | null;
}

export interface RecordListParams {
  page?: number;
  size?: number;
  from?: string;
  to?: string;
}

export interface MedicalRecordWithPet extends MedicalRecordSummary {
  petId: number;
  petName: string;
}

export const recordApi = {
  getRecords: (petId: number, params: RecordListParams = {}) =>
    client.get<PageResponse<MedicalRecordSummary>>(`/api/pets/${petId}/records`, { params }),

  // "전체" 모드 — 현재 유저 모든 펫 진료기록 페이지네이션
  getAllRecords: (params: { page?: number; size?: number } = {}) =>
    client.get<PageResponse<MedicalRecordWithPet>>('/api/records', { params }),

  getRecord: (petId: number, recordId: number) =>
    client.get<MedicalRecord>(`/api/pets/${petId}/records/${recordId}`),

  createRecord: (petId: number, data: RecordRequest) =>
    client.post<MedicalRecord>(`/api/pets/${petId}/records`, data),

  updateRecord: (petId: number, recordId: number, data: RecordRequest) =>
    client.put<MedicalRecord>(`/api/pets/${petId}/records/${recordId}`, data),

  deleteRecord: (petId: number, recordId: number) =>
    client.delete<void>(`/api/pets/${petId}/records/${recordId}`),

  uploadAttachment: (petId: number, recordId: number, uri: string) => {
    const formData = new FormData();
    formData.append('file', { uri, type: 'image/jpeg', name: 'attachment.jpg' } as any);
    return client.post<Attachment>(
      `/api/pets/${petId}/records/${recordId}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  deleteAttachment: (petId: number, recordId: number, attachmentId: number) =>
    client.delete<void>(`/api/pets/${petId}/records/${recordId}/attachments/${attachmentId}`),

  // 사용자가 이전에 입력한 병원명 (records + appointments union) — autocomplete
  getHospitalSuggestions: (petId: number) =>
    client.get<string[]>(`/api/pets/${petId}/records/hospital-suggestions`),

  parseOcr: (imageUri: string) => {
    const formData = new FormData();
    formData.append('file', { uri: imageUri, type: 'image/jpeg', name: 'ocr.jpg' } as any);
    return client.post<OcrResult>('/api/records/ocr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
