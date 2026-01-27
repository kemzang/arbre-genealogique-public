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
  }
};
