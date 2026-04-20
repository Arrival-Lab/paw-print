import client from '../../../shared/api/client';

export interface FoodInfo {
  id: number;
  currentFood: string | null;
  allergies: string[];
  forbiddenFoods: string[];
  notes: string | null;
  updatedAt: string;
}

export interface FoodInfoRequest {
  currentFood?: string;
  allergies?: string[];
  forbiddenFoods?: string[];
  notes?: string;
}

export const foodApi = {
  get: (petId: number) =>
    client.get<FoodInfo | null>(`/api/pets/${petId}/food`),

  upsert: (petId: number, data: FoodInfoRequest) =>
    client.put<FoodInfo>(`/api/pets/${petId}/food`, data),
};
