import api from './api';

export interface Message {
  id: number;
  content: string;
  sentAt: string;
  sender: {
    id: number;
    displayName: string;
    email: string;
  };
}

export interface SendMessageRequest {
  chatRoomId: number;
  content: string;
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
  async getChatRooms(familyId: number): Promise<{id: number, name: string}[]> {
    const response = await api.get<{id: number, name: string}[]>(`/chat/rooms?familyId=${familyId}`);
    return response.data;
  }
};
