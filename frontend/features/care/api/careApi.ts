import client from '../../../shared/api/client';

export type CareItemType =
  | 'MEAL'
  | 'SNACK'
  | 'SUPPLEMENT'
  | 'WALK'
  | 'BRUSH'
  | 'MEDICATION'
  | 'CUSTOM';

export interface CareItem {
  id: number;
  name: string;
  itemType: CareItemType;
  targetCount: number;
  sortOrder: number;
  reminderTime: string | null;  // "HH:mm" 또는 null
}

export interface DailyCare {
  itemId: number;
  name: string;
  itemType: CareItemType;
  targetCount: number;
  sortOrder: number;
  count: number;
  checkId: number | null;
  date: string;
  reminderTime: string | null;  // "HH:mm" 또는 null
}

export interface HomeCare {
  petId: number;
  petName: string;
  totalTargets: number;
  totalCompleted: number;
  items: DailyCare[];
}

export interface CareItemRequest {
  name: string;
  itemType: CareItemType;
  targetCount?: number;
  sortOrder?: number;
}

export interface CareCheckRequest {
  date: string;       // yyyy-MM-dd
  count: number;      // 0 = 해제, >=1 = 횟수
  note?: string;
}

export const careApi = {
  listItems: (petId: number) =>
    client.get<CareItem[]>(`/api/pets/${petId}/care/items`),

  createItem: (petId: number, data: CareItemRequest) =>
    client.post<CareItem>(`/api/pets/${petId}/care/items`, data),

  updateItem: (petId: number, itemId: number, data: CareItemRequest) =>
    client.put<CareItem>(`/api/pets/${petId}/care/items/${itemId}`, data),

  deleteItem: (petId: number, itemId: number) =>
    client.delete<void>(`/api/pets/${petId}/care/items/${itemId}`),

  getDay: (petId: number, date: string) =>
    client.get<DailyCare[]>(`/api/pets/${petId}/care/day`, { params: { date } }),

  setCheck: (petId: number, itemId: number, data: CareCheckRequest) =>
    client.put<DailyCare>(`/api/pets/${petId}/care/items/${itemId}/check`, data),

  homeToday: (date?: string) =>
    client.get<HomeCare[]>('/api/care/home', { params: date ? { date } : {} }),
};
