import api from './api';

export interface UserProfile {
  id: number;
  email: string;
  displayName: string;
  profilePictureUrl?: string;
  createdAt: string;
  isSuperAdmin: boolean;
}

export interface UpdateProfileRequest {
  displayName?: string;
  profilePictureUrl?: string;
  currentPassword?: string;
  newPassword?: string;
}

/**
 * Service pour gérer les photos de profil et le profil utilisateur
 */
export const profileService = {
  /**
   * Génère une URL de photo de profil temporaire
   * @param name - Nom de l'utilisateur
   * @param file - Fichier image (pour validation)
   * @returns URL de la photo de profil
   */
  async generateProfilePictureUrl(name: string, file?: File): Promise<string> {
    // Validation du fichier si fourni
    if (file) {
      if (!file.type.startsWith('image/')) {
        throw new Error('Le fichier doit être une image');
      }
      
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('La photo ne peut pas dépasser 5MB');
      }
    }
    
    // Pour l'instant, utiliser UI Avatars comme solution temporaire
    const cleanName = name.trim() || 'User';
    const colors = ['FF416C', '4834d4', '686de0', '30336b', '130f40', '6c5ce7', 'a29bfe', 'fd79a8', 'fdcb6e', 'e17055'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=${randomColor}&color=fff&size=200&font-size=0.6&bold=true`;
  },

  /**
   * Upload une photo de profil
   * @param file - Fichier image
   * @param userId - ID de l'utilisateur
   * @returns URL de la photo uploadée
   */
  async uploadProfilePicture(file: File, userId: number): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId.toString());
    
    try {
      const response = await api.post<{ urlPath: string }>('/users/profile-picture', formData, {
        headers: {
          'Content-Type': undefined
        }
      });
      return response.data.urlPath;
    } catch (error) {
      console.warn('Upload de photo de profil non disponible, utilisation d\'un avatar généré');
      return this.generateProfilePictureUrl(`User${userId}`, file);
    }
  },

  /**
   * Récupérer le profil de l'utilisateur connecté
   */
  async getProfile(): Promise<UserProfile> {
    const response = await api.get<UserProfile>('/users/profile');
    return response.data;
  },

  /**
   * Modifier le profil
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await api.patch<UserProfile>('/users/profile', data);
    return response.data;
  }
};