import api from './api';

export interface MediaItem {
  id: number;
  urlPath: string; // Changed from url
  mediaType: 'IMAGE' | 'VIDEO' | 'FILE'; // Changed from type
  createdAt?: string; // Optional in some responses
  uploader?: { displayName: string };
  person?: { firstName: string, lastName: string };
}

export interface RegisterMediaRequest {
  familyId: number;
  personId?: number;
  urlPath: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'FILE';
}

/**
 * Détecte automatiquement le type de média basé sur l'extension du fichier
 */
function detectMediaType(filename: string): 'IMAGE' | 'VIDEO' | 'FILE' {
  const ext = filename.toLowerCase().split('.').pop() || '';
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'heic', 'heif'];
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v', '3gp', 'mpeg', 'mpg'];
  
  if (imageExtensions.includes(ext)) {
    return 'IMAGE';
  } else if (videoExtensions.includes(ext)) {
    return 'VIDEO';
  } else {
    return 'FILE';
  }
}

export const mediaService = {
  // Récupérer les médias d'une famille
  async getRecentMedia(familyId: number, type?: 'IMAGE' | 'VIDEO' | 'FILE', chatRoomId?: number): Promise<MediaItem[]> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (chatRoomId) params.append('chatRoomId', chatRoomId.toString());
    
    const response = await api.get<MediaItem[]>(`/family/${familyId}/media?${params.toString()}`);
    return response.data;
  },

  // Enregistrer les métadonnées d'un média
  async registerMedia(data: RegisterMediaRequest): Promise<MediaItem> {
    const response = await api.post<MediaItem>('/media/upload', data);
    return response.data;
  },

  /**
   * Upload un fichier avec détection automatique du type
   * @param file - Le fichier à uploader
   * @param familyId - L'ID de la famille
   * @param personId - (Optionnel) L'ID de la personne associée
   * @param onProgress - (Optionnel) Callback pour suivre la progression
   * @returns Le média créé
   */
  async uploadFile(
    file: File, 
    familyId: number, 
    personId?: number,
    onProgress?: (progress: number) => void
  ): Promise<MediaItem> {
    // Détection automatique du type de média
    const mediaType = detectMediaType(file.name);
    
    // Création du FormData pour l'upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('familyId', familyId.toString());
    formData.append('mediaType', mediaType);
    if (personId) {
      formData.append('personId', personId.toString());
    }

    // Configuration pour suivre la progression
    // IMPORTANT : Ne PAS définir Content-Type manuellement !
    // Le navigateur doit le faire automatiquement avec le bon boundary
    const config: any = {
      headers: {
        // On supprime explicitement le Content-Type pour que le navigateur
        // ajoute automatiquement : multipart/form-data; boundary=...
        'Content-Type': undefined
      }
    };

    // Ajout du callback de progression si fourni
    if (onProgress) {
      config.onUploadProgress = (progressEvent: any) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      };
    }

    const response = await api.post<MediaItem>('/media/upload-large', formData, config);
    return response.data;
  }
};
