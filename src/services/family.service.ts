import api from './api';

export interface Family {
  id: number;
  familyName: string;
  createdAt: string;
  updatedAt: string;
  isMember?: boolean;
}

export interface JoinFamilyRequest {
  familyId: number;
  gender: 'M' | 'F' | 'O';
  relatedToPersonId?: number; // Optional if joining as first member/admin, but usually required for join
  relationshipType?: 'PARENTAL' | 'UNION' | 'SIBLING';
}

export interface PendingMember {
  id: number;
  familyId: number;
  userId: number;
  userEmail: string;
  joinedAt: string;
}

export const familyService = {
  // Créer une nouvelle famille
  async createFamily(familyName: string): Promise<Family> {
    const response = await api.post<Family>('/family', { familyName });
    return response.data;
  },

  // Rejoindre une famille
  async joinFamily(data: JoinFamilyRequest) {
    const response = await api.post('/family/join', data);
    return response.data;
  },

  // Rechercher une famille
  async searchFamilies(name: string): Promise<Family[]> {
    const response = await api.get<Family[]>(`/family/search?name=${encodeURIComponent(name)}`);
    return response.data;
  },

  // Obtenir les membres en attente
  async getPendingMembers(): Promise<PendingMember[]> {
    const response = await api.get<PendingMember[]>('/family/pending-members');
    return response.data;
  }
};
