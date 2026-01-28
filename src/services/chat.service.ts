import api from './api';
import type { MediaItem } from './media.service';

export interface Message {
  id: number;
  content: string;
  sentAt: string;
  sender: {
    id: number;
    displayName: string;
    email: string;
  };
  attachments?: MediaItem[];
}

export interface SendMessageRequest {
  chatRoomId: number;
  content?: string; // Optional if attachments present
  attachmentIds?: number[];
}

export interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  avatarUrl?: string;
  channelType: 'PUBLIC' | 'PRIVATE';
  _count?: { messages: number };
  participants?: { id: number; displayName: string; email: string; }[];
  creatorId?: number; // Pour savoir si on est admin (si le backend le renvoie, sinon on suppose que le créateur est admin)
}

export interface CreateRoomRequest {
  familyId: number;
  name: string;
  description?: string;
  avatarUrl?: string;
  isPrivate?: boolean;
  participantIds?: number[];
}

export interface UpdateRoomRequest {
  chatRoomId: number;
  name?: string;
  description?: string;
  avatarUrl?: string;
  channelType?: 'PUBLIC' | 'PRIVATE';
}

export const chatService = {
  // Envoyer un message
  async sendMessage(data: SendMessageRequest): Promise<Message> {
    const response = await api.post<Message>('/chat/message', data);
    return response.data;
  },

  // Récupérer les messages
  async getMessages(chatRoomId: number): Promise<Message[]> {
    const response = await api.get<Message[]>(`/chat/messages?chatRoomId=${chatRoomId}`);
    return response.data;
  },

  // Récupérer les salons de discussion
  async getChatRooms(familyId: number): Promise<ChatRoom[]> {
    const response = await api.get<ChatRoom[]>(`/chat/rooms?familyId=${familyId}`);
    return response.data;
  },

  // Créer un salon
  async createRoom(data: CreateRoomRequest): Promise<ChatRoom> {
    const response = await api.post<ChatRoom>('/chat/rooms', data);
    return response.data;
  },

  // Mettre à jour un salon
  async updateRoom(data: UpdateRoomRequest): Promise<ChatRoom> {
    const response = await api.put<ChatRoom>('/chat/rooms', data);
    return response.data;
  },

  // Ajouter un participant
  async addParticipant(chatRoomId: number, userIdToAdd: number): Promise<void> {
    await api.post('/chat/rooms/participants', { chatRoomId, userIdToAdd });
  },

  // Retirer un participant
  async removeParticipant(chatRoomId: number, userIdToRemove: number): Promise<void> {
    await api.delete('/chat/rooms/participants', { data: { chatRoomId, userIdToRemove } });
  }
};
