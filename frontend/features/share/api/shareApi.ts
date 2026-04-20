import client from '../../../shared/api/client';

export interface InviteResponse {
  inviteLink: string;
  expiresAt: string;
}

export interface AcceptResponse {
  petId: number;
  petName: string;
}

export interface ShareMember {
  id: number;
  memberId: number;
  memberName: string;
  memberProfileImage: string | null;
  acceptedAt: string;
}

export const shareApi = {
  invite: (petId: number) =>
    client.post<InviteResponse>(`/api/pets/${petId}/share/invite`),

  accept: (token: string) =>
    client.post<AcceptResponse>(`/api/share/accept`, null, { params: { token } }),

  getMembers: (petId: number) =>
    client.get<ShareMember[]>(`/api/pets/${petId}/share/members`),

  removeMember: (petId: number, memberId: number) =>
    client.delete<void>(`/api/pets/${petId}/share/members/${memberId}`),
};
