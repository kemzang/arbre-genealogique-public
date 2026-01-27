import api from './api';

export interface MemberStatus {
  familyId: number;
  familyName: string;
  status: 'ACTIVE' | 'PENDING';
  role: 'ADMIN' | 'VIEWER' | 'EDITOR';
}

export interface ValidateMemberRequest {
  targetMemberId: number;
  vote: 'APPROVE' | 'REJECT';
}

export const memberService = {
  // Obtenir le statut de l'utilisateur dans ses familles
  async getMemberStatus(): Promise<MemberStatus[]> {
    const response = await api.get<MemberStatus[]>('/member/status');
    return response.data;
  },

  // Valider un membre
  async validateMember(data: ValidateMemberRequest): Promise<{ success: true }> {
    const response = await api.post<{ success: true }>('/member/validate', data);
    return response.data;
  }
};
