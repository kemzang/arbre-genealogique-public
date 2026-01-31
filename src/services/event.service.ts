import api from './api';

export interface FamilyEvent {
  id: number;
  familyId: number;
  title: string;
  eventDate?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    media: number;
  };
}

export interface FamilyEventWithMedia extends FamilyEvent {
  media: Array<{
    id: number;
    urlPath: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'FILE';
    uploader: {
      displayName: string;
    };
  }>;
}

export interface CreateEventRequest {
  familyId: number;
  title: string;
  eventDate?: string;
  location?: string;
}

export interface UpdateEventRequest {
  title?: string;
  eventDate?: string;
  location?: string;
}

class EventService {
  /**
   * Créer un nouvel événement familial
   */
  async createEvent(data: CreateEventRequest): Promise<FamilyEvent> {
    const response = await api.post<FamilyEvent>('/event', data);
    return response.data;
  }

  /**
   * Lister tous les événements d'une famille
   */
  async getFamilyEvents(familyId: number): Promise<FamilyEvent[]> {
    const response = await api.get<FamilyEvent[]>(`/family/${familyId}/events`);
    return response.data;
  }

  /**
   * Obtenir les détails d'un événement avec ses médias
   */
  async getEventDetails(eventId: number): Promise<FamilyEventWithMedia> {
    const response = await api.get<FamilyEventWithMedia>(`/event/${eventId}`);
    return response.data;
  }

  /**
   * Modifier un événement
   */
  async updateEvent(eventId: number, data: UpdateEventRequest): Promise<FamilyEvent> {
    const response = await api.patch<FamilyEvent>(`/event/${eventId}`, data);
    return response.data;
  }

  /**
   * Supprimer un événement
   */
  async deleteEvent(eventId: number): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(`/event/${eventId}`);
    return response.data;
  }
}

export const eventService = new EventService();