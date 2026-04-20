import client from '../../../shared/api/client';

export interface Pet {
  id: number;
  name: string;
  species: 'DOG' | 'CAT' | 'BIRD' | 'REPTILE' | 'SMALL_ANIMAL' | 'OTHER';
  breed: string | null;
  birthDate: string | null;
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  isNeutered: boolean;
  profileImage: string | null;
}

export interface PetRequest {
  name: string;
  species: Pet['species'];
  breed?: string;
  birthDate?: string;
  gender: Pet['gender'];
  isNeutered: boolean;
}

export const petApi = {
  getPets: () => client.get<Pet[]>('/api/pets'),

  getPet: (petId: number) => client.get<Pet>(`/api/pets/${petId}`),

  createPet: (data: PetRequest) => client.post<Pet>('/api/pets', data),

  updatePet: (petId: number, data: PetRequest) =>
    client.put<Pet>(`/api/pets/${petId}`, data),

  deletePet: (petId: number) => client.delete<void>(`/api/pets/${petId}`),

  uploadProfileImage: (petId: number, uri: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);
    return client.post<{ profileImage: string }>(
      `/api/pets/${petId}/profile-image`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
};
