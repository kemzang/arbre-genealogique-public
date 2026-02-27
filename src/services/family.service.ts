import api from './api';

export interface Family {
  id: number;
  familyName: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt?: string;
  isMember?: boolean;
}

export interface JoinFamilyRequest {
  familyId: number;
  gender: 'M' | 'F' | 'O';
  relatedToPersonId?: number;
  relationshipType?: 'PARENTAL' | 'UNION' | 'SIBLING';
}

export interface PendingMember {
  id: number;
  familyId: number;
  userId: number;
  userEmail: string;
  userDisplayName?: string;
  profilePictureUrl?: string;
  joinedAt: string;
  applicationData: {
    gender: 'M' | 'F' | 'O';
    relatedToPersonId?: number;
    relationshipType?: 'PARENTAL' | 'UNION' | 'SIBLING';
  };
}

export interface FamilyMergeRequest {
  id: number;
  sourceFamilyId: number;
  targetFamilyId: number;
  requesterId: number;
  sourcePersonId: number;
  targetPersonId: number;
  relationshipType: 'PARENTAL' | 'UNION' | 'SIBLING';
  justification?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  sourceFamily?: {
    familyName: string;
  };
  targetFamily?: {
    familyName: string;
  };
  sourcePerson?: {
    firstName: string;
    lastName: string;
  };
  targetPerson?: {
    firstName: string;
    lastName: string;
  };
  requester?: {
    displayName: string;
  };
}

export interface FusionRequestData {
  sourceFamilyId: number;
  targetFamilyId: number;
  sourcePersonId: number; // Personne de la famille source (requis)
  targetPersonId: number; // Personne de la famille cible (requis)
  relationshipType: 'PARENTAL' | 'UNION' | 'SIBLING'; // Requis
  justification?: string; // Optionnel
}

export interface ValidateCrossRelationshipData {
  requestId: number;
  action: 'APPROVE' | 'REJECT';
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

  // Obtenir les demandes d'adhésion en attente
  async getPendingMembers(): Promise<PendingMember[]> {
    const response = await api.get<PendingMember[]>('/family/pending-members');
    return response.data;
  },

  // 🚀 NOUVEAU : Initier une demande de fusion entre familles
  async createFusionRequest(data: FusionRequestData): Promise<FamilyMergeRequest> {
    const response = await api.post<FamilyMergeRequest>('/family/fusion-request', data);
    return response.data;
  },

  // 🚀 NOUVEAU : Valider ou rejeter une demande de fusion
  async validateCrossRelationship(data: ValidateCrossRelationshipData): Promise<{
    updatedRequest: FamilyMergeRequest;
    connection?: {
      id: number;
      familyAId: number;
      familyBId: number;
      createdAt: string;
    };
    relationship?: {
      id: number;
      personAId: number;
      personBId: number;
      type: 'PARENTAL' | 'UNION' | 'SIBLING';
      status: 'ACTIVE' | 'ENDED' | 'DECEASED';
      startDate: string;
      isBiological: boolean;
    };
    message?: string;
  }> {
    const response = await api.post('/family/validate-cross-relationship', data);
    return response.data;
  },

  // 🚀 NOUVEAU : Obtenir les demandes de fusion en attente
  async getPendingFusionRequests(): Promise<FamilyMergeRequest[]> {
    const response = await api.get<FamilyMergeRequest[]>('/family/fusion-requests');
    return response.data;
  }
};