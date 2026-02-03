import api from './api';

export interface Person {
  id: number;
  familyId: number;
  firstName: string;
  lastName: string;
  birthDate?: string;
  deathDate?: string;
  gender: 'M' | 'F' | 'O';
  bio?: string;
  profilePictureUrl?: string; // Photo de profil (hérité du User si lié)
  linkedUserId?: number;
}

export interface Relationship {
  id: number;
  personAId: number;
  personBId: number;
  type: 'PARENTAL' | 'UNION' | 'SIBLING';
  isBiological: boolean;
  status?: 'ACTIVE' | 'ENDED' | 'DECEASED';
  startDate?: string;
  endDate?: string;
  endReason?: string;
  notes?: string;
}

export interface TreeData {
  persons: Person[];
  relationships: Relationship[];
  primaryFamilyId?: number;
  connectedFamiliesCount?: number;
}

export interface CreatePersonRequest {
  familyId: number;
  firstName: string;
  lastName: string;
  birthDate?: string;
  deathDate?: string;
  gender: 'M' | 'F' | 'O';
  bio?: string;
  profilePictureUrl?: string; // Optionnel (hérité du User si lié)
  linkedUserId?: number;
}

export interface CreateRelationshipRequest {
  personAId: number;
  personBId: number;
  type: 'PARENTAL' | 'UNION' | 'SIBLING';
  isBiological?: boolean; // Optionnel, défaut: true
  startDate?: string; // Format: "2024-06-15" (optionnel, défaut: aujourd'hui)
  notes?: string; // Notes additionnelles (optionnel)
}

export interface RelationshipInfo {
  id: number;
  status: 'ACTIVE' | 'ENDED' | 'DECEASED';
  startDate?: string;
  endDate?: string;
  endReason?: string;
  isBiological?: boolean;
  notes?: string;
}

export interface PersonWithRelationshipInfo extends Person {
  relationshipInfo: RelationshipInfo;
}

export interface RelationshipHistory {
  totalMarriages: number;
  currentMarriages: number;
  divorces: number;
  widowed: number;
}

export interface PersonDetails {
  person: Person & {
    media?: Array<{
      id: number;
      urlPath: string;
      mediaType: 'IMAGE' | 'VIDEO' | 'FILE';
    }>;
  };
  parents: PersonWithRelationshipInfo[];
  children: PersonWithRelationshipInfo[];
  currentSpouses: PersonWithRelationshipInfo[];
  formerSpouses: PersonWithRelationshipInfo[];
  allSpouses: PersonWithRelationshipInfo[];
  siblings: PersonWithRelationshipInfo[];
  relationshipHistory: RelationshipHistory;
}

export interface RelationshipDetails {
  relationship: Relationship & {
    personA: Person;
    personB: Person;
  };
  children?: Person[];
}

export interface EndRelationshipRequest {
  endReason: string; // Requis
  endDate?: string; // Format: "2024-12-01" (optionnel, défaut: aujourd'hui)
  notes?: string; // Optionnel
}

export interface EndRelationshipResponse extends Relationship {
  personA?: Person;
  personB?: Person;
  warning?: string; // Avertissement si dernière relation entre familles
}

export interface RelationshipHistoryResponse {
  relationships: Array<Relationship & {
    personA: Person;
    personB: Person;
  }>;
  activeRelationships: Array<Relationship & {
    personA: Person;
    personB: Person;
  }>;
  endedRelationships: Array<Relationship & {
    personA: Person;
    personB: Person;
  }>;
  deceasedRelationships: Array<Relationship & {
    personA: Person;
    personB: Person;
  }>;
  stats: {
    total: number;
    active: number;
    ended: number;
    deceased: number;
    byType: {
      unions: number;
      parental: number;
      siblings: number;
    };
  };
}

export const treeService = {
  // Récupérer l'arbre généalogique (maintenant multi-famille)
  async getTree(familyId?: number): Promise<TreeData> {
    const query = familyId ? `?familyId=${familyId}` : '';
    const response = await api.get<TreeData>(`/tree${query}`);
    return response.data;
  },

  // Créer une personne
  async createPerson(data: CreatePersonRequest): Promise<Person> {
    const response = await api.post<Person>('/person', data);
    return response.data;
  },

  // Créer une relation (maintenant supporte inter-familles)
  async createRelationship(data: CreateRelationshipRequest): Promise<Relationship> {
    const response = await api.post<Relationship>('/relationship', data);
    return response.data;
  },

  // 🚀 NOUVEAU : Obtenir les détails complets d'une personne
  async getPersonDetails(personId: number): Promise<PersonDetails> {
    const response = await api.get<PersonDetails>(`/person/${personId}`);
    return response.data;
  },

  // 🚀 NOUVEAU : Mettre à jour une personne
  async updatePerson(personId: number, data: {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    deathDate?: string;
    gender?: 'M' | 'F' | 'O';
    bio?: string;
    profilePictureUrl?: string;
  }): Promise<Person> {
    const response = await api.patch<Person>(`/person/${personId}`, data);
    return response.data;
  },

  // 🚀 NOUVEAU : Obtenir les détails d'une relation avec enfants
  async getRelationshipDetails(relationshipId: number): Promise<RelationshipDetails> {
    const response = await api.get<RelationshipDetails>(`/relationship/${relationshipId}`);
    return response.data;
  },

  // Modifier une relation
  async updateRelationship(relationshipId: number, data: {
    type?: 'PARENTAL' | 'UNION' | 'SIBLING';
    isBiological?: boolean;
  }): Promise<Relationship> {
    const response = await api.patch<Relationship>(`/relationship/${relationshipId}`, data);
    return response.data;
  },

  // Supprimer une relation
  async deleteRelationship(relationshipId: number): Promise<{ success: boolean }> {
    const response = await api.delete(`/relationship/${relationshipId}`);
    return response.data;
  },

  // 🚀 NOUVEAU : Terminer une relation (divorce, séparation, décès)
  async endRelationship(relationshipId: number, data: EndRelationshipRequest): Promise<EndRelationshipResponse> {
    const response = await api.patch<EndRelationshipResponse>(`/relationship/${relationshipId}/end`, data);
    return response.data;
  },

  // 🚀 NOUVEAU : Obtenir l'historique complet des relations
  async getRelationshipHistory(params: {
    personId?: number;
    familyId?: number;
  }): Promise<RelationshipHistoryResponse> {
    const queryParams = new URLSearchParams();
    if (params.personId) queryParams.append('personId', params.personId.toString());
    if (params.familyId) queryParams.append('familyId', params.familyId.toString());
    
    const response = await api.get<RelationshipHistoryResponse>(`/relationship/history?${queryParams.toString()}`);
    return response.data;
  }
};
