import api from './api';

export interface FamilyMergeRequest {
  id: number;
  sourceFamilyId: number;
  targetFamilyId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  sourceFamilyName?: string;
  targetFamilyName?: string;
}

export interface FusionRequestData {
  sourceFamilyId: number;
  targetFamilyId: number;
}

export interface ValidateCrossRelationshipData {
  requestId: number;
  action: 'APPROVE' | 'REJECT';
}

export interface FamilyConnection {
  id: number;
  familyAId: number;
  familyBId: number;
  createdAt: string;
  familyA: {
    id: number;
    familyName: string;
  };
  familyB: {
    id: number;
    familyName: string;
  };
}

export interface MultiFamilyTreeData {
  persons: Array<{
    id: number;
    familyId: number;
    firstName: string;
    lastName: string;
    gender: 'M' | 'F' | 'O';
    profilePictureUrl?: string;
    linkedUserId?: number;
    familyName?: string; // Nom de la famille d'origine
  }>;
  relationships: Array<{
    id: number;
    personAId: number;
    personBId: number;
    type: 'PARENTAL' | 'UNION' | 'SIBLING';
    isBiological: boolean;
    isInterFamily?: boolean; // Indique si c'est une relation inter-famille
  }>;
  primaryFamilyId: number;
  connectedFamilies: Array<{
    id: number;
    familyName: string;
    personCount: number;
  }>;
}

export const multiFamilyService = {
  /**
   * Obtenir l'arbre multi-famille avec toutes les connexions
   * Utilise l'endpoint /api/tree qui retourne maintenant les familles connectées
   */
  async getMultiFamilyTree(primaryFamilyId: number): Promise<MultiFamilyTreeData> {
    const response = await api.get<MultiFamilyTreeData>(`/tree?familyId=${primaryFamilyId}`);
    return response.data;
  },

  /**
   * Initier une demande de fusion entre deux familles
   * Endpoint: POST /api/family/fusion-request
   */
  async requestFamilyFusion(data: FusionRequestData): Promise<FamilyMergeRequest> {
    const response = await api.post<FamilyMergeRequest>('/family/fusion-request', data);
    return response.data;
  },

  /**
   * Valider ou rejeter une demande de fusion
   * Endpoint: POST /api/family/validate-cross-relationship
   */
  async validateFusionRequest(data: ValidateCrossRelationshipData): Promise<{ 
    success: boolean; 
    connection?: FamilyConnection;
    message: string;
  }> {
    const response = await api.post('/family/validate-cross-relationship', data);
    return response.data;
  },

  /**
   * Créer une relation inter-famille (utilise l'endpoint standard relationship)
   * Le backend gère automatiquement les relations inter-familles si FamilyConnection existe
   */
  async createInterFamilyRelationship(data: {
    personAId: number;
    personBId: number;
    type: 'PARENTAL' | 'UNION' | 'SIBLING';
    isBiological: boolean;
  }): Promise<{
    id: number;
    personAId: number;
    personBId: number;
    type: string;
    isBiological: boolean;
  }> {
    const response = await api.post('/relationship', data);
    return response.data;
  }
};