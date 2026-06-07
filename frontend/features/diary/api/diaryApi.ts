import client from '../../../shared/api/client';
import type { PageResponse } from '../../../shared/api/types';
import { filePartFromUri } from '../../../shared/utils/upload';

export interface DiaryPhoto {
  id: number;
  photoUrl: string;
  sortOrder: number;
}

export interface Diary {
  id: number;
  diaryDate: string;
  title: string | null;
  content: string | null;
  photos: DiaryPhoto[];
  tags: string[];
}

export interface DiarySummary {
  id: number;
  diaryDate: string;
  title: string | null;
  content: string | null;
  tags: string[];
  photoCount: number;
  thumbnail: string | null;
}

export interface MemoryDiary {
  id: number;
  petId: number;
  petName: string;
  diaryDate: string;
  title: string | null;
  content: string | null;
  photoCount: number;
  thumbnail: string | null;
}

export interface CalendarDayInfo {
  thumbnail: string | null;
  hasRecord: boolean;
  tags: string[];
}

export interface DiaryRequest {
  diaryDate: string;
  title?: string;
  content?: string;
  tags?: string[];
}

export const diaryApi = {
  getDiaries: (petId: number, params?: { from?: string; to?: string; page?: number; size?: number }) =>
    client.get<PageResponse<DiarySummary>>(`/api/pets/${petId}/diaries`, { params }),

  getDiary: (petId: number, diaryId: number) =>
    client.get<Diary>(`/api/pets/${petId}/diaries/${diaryId}`),

  createOrUpdate: (petId: number, data: DiaryRequest) =>
    client.post<Diary>(`/api/pets/${petId}/diaries`, data),

  updateDiary: (petId: number, diaryId: number, data: DiaryRequest) =>
    client.put<Diary>(`/api/pets/${petId}/diaries/${diaryId}`, data),

  deleteDiary: (petId: number, diaryId: number) =>
    client.delete<void>(`/api/pets/${petId}/diaries/${diaryId}`),

  addPhoto: (petId: number, diaryId: number, uri: string) => {
    const formData = new FormData();
    formData.append('file', filePartFromUri(uri, 'diary') as any);
    return client.post<DiaryPhoto>(
      `/api/pets/${petId}/diaries/${diaryId}/photos`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  deletePhoto: (petId: number, diaryId: number, photoId: number) =>
    client.delete<void>(`/api/pets/${petId}/diaries/${diaryId}/photos/${photoId}`),

  getCalendar: (petId: number, year: number, month: number) =>
    client.get<Record<string, CalendarDayInfo>>(`/api/pets/${petId}/diaries/calendar`, {
      params: { year, month },
    }),

  // "전체" 모드 — 현재 유저의 모든 펫 캘린더를 서버에서 병합
  getCalendarAll: (year: number, month: number) =>
    client.get<Record<string, CalendarDayInfo>>('/api/diaries/calendar', {
      params: { year, month },
    }),

  // "N년 전 오늘" 회고 — 본인+공유 펫의 같은 월/일, 오늘 이전 다이어리
  getMemories: () =>
    client.get<MemoryDiary[]>('/api/diaries/memories'),

  search: (petId: number, params: { keyword?: string; tags?: string; page?: number; size?: number }) =>
    client.get<PageResponse<DiarySummary>>(`/api/pets/${petId}/diaries/search`, { params }),
};
