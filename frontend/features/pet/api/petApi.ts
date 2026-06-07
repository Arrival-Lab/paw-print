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
  /** 펫 식별 색상 (#RRGGBB). 미지정 펫은 null — UI 에서 id 기반 기본 팔레트로 폴백. */
  color?: string | null;
  /** 현재 user 가 owner 가 아닐 때 true (공유받은 펫). */
  isShared?: boolean;
  /** isShared=true 면 원래 소유자 이름. */
  ownerName?: string | null;
  /** ACCEPTED 상태 공유 멤버 수 (소유자 제외). 백엔드가 안 주는 응답에선 undefined. */
  sharedMemberCount?: number | null;
}

export interface PetRequest {
  name: string;
  species: Pet['species'];
  breed?: string;
  birthDate?: string;
  gender: Pet['gender'];
  isNeutered: boolean;
  /** 펫 식별 색상 (#RRGGBB). 미지정 시 생략. */
  color?: string;
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

  deleteProfileImage: (petId: number) =>
    client.delete<void>(`/api/pets/${petId}/profile-image`),
};
