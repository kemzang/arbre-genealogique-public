import api from './api';

export interface MediaItem {
  id: number;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  createdAt: string;
}

export const mediaService = {
  // Récupérer les médias récents d'une famille
  async getRecentMedia(familyId: number): Promise<MediaItem[]> {
    const response = await api.get<MediaItem[]>(`/family/${familyId}/media`);
    return response.data;
  },

  // Upload un média (pour plus tard)
  async uploadMedia(familyId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('familyId', familyId.toString());
    const response = await api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};
