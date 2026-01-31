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
  photoUrl?: string; // Suggéré pour l'affichage
  linkedUserId?: number;
}

export interface Relationship {
  id: number;
  personAId: number;
  personBId: number;
  type: 'PARENTAL' | 'UNION' | 'SIBLING';
  isBiological: boolean;
}

export interface TreeData {
  persons: Person[];
  relationships: Relationship[];
}

export interface CreatePersonRequest {
  familyId: number;
  firstName: string;
  lastName: string;
  birthDate?: string;
  deathDate?: string;
  gender: 'M' | 'F' | 'O';
  bio?: string;
  linkedUserId?: number;
}

export interface CreateRelationshipRequest {
  personAId: number;
  personBId: number;
  type: 'PARENTAL' | 'UNION' | 'SIBLING';
  isBiological: boolean;
}

export const treeService = {
  // Récupérer l'arbre généalogique
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

  // Créer une relation
  async createRelationship(data: CreateRelationshipRequest): Promise<Relationship> {
    const response = await api.post<Relationship>('/relationship', data);
    return response.data;
  },

  // NOUVEAU : Obtenir les détails d'une personne
  async getPersonDetails(personId: number): Promise<{
    person: Person;
    parents: Person[];
    children: Person[];
    spouses: Person[];
    siblings: Person[];
  }> {
    const response = await api.get(`/person/${personId}`);
    return response.data;
  },

  // NOUVEAU : Obtenir les détails d'une relation
  async getRelationshipDetails(relationshipId: number): Promise<{
    relationship: Relationship & {
      personA: Person;
      personB: Person;
    };
    children?: Person[];
  }> {
    const response = await api.get(`/relationship/${relationshipId}`);
    return response.data;
  },

  // NOUVEAU : Modifier une relation
  async updateRelationship(relationshipId: number, data: {
    type?: 'PARENTAL' | 'UNION' | 'SIBLING';
    isBiological?: boolean;
  }): Promise<Relationship> {
    const response = await api.patch<Relationship>(`/relationship/${relationshipId}`, data);
    return response.data;
  },

  // NOUVEAU : Supprimer une relation
  async deleteRelationship(relationshipId: number): Promise<{ success: boolean }> {
    const response = await api.delete(`/relationship/${relationshipId}`);
    return response.data;
  }
};
