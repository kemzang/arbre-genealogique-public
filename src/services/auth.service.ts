import api from './api';

// Types pour les requêtes
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  profilePictureUrl: string; // Requis - Photo obligatoire pour l'affichage dans l'arbre
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Types pour les réponses
export interface User {
  id: number;
  email: string;
  displayName?: string;
  profilePictureUrl?: string;
  role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isSuperAdmin?: boolean; // Propriété du backend
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  // Fonction utilitaire pour vérifier si un utilisateur est super-admin
  isSuperAdmin(user: User | null): boolean {
    console.log('isSuperAdmin called with user:', user);
    
    if (!user) {
      console.log('isSuperAdmin - No user provided');
      return false;
    }
    
    const hasIsSuperAdmin = user.isSuperAdmin === true;
    const hasRoleSuperAdmin = user.role === 'SUPER_ADMIN';
    
    console.log('isSuperAdmin - user.isSuperAdmin:', user.isSuperAdmin);
    console.log('isSuperAdmin - user.role:', user.role);
    console.log('isSuperAdmin - hasIsSuperAdmin:', hasIsSuperAdmin);
    console.log('isSuperAdmin - hasRoleSuperAdmin:', hasRoleSuperAdmin);
    
    const result = hasIsSuperAdmin || hasRoleSuperAdmin;
    console.log('isSuperAdmin - final result:', result);
    
    return result;
  },

  // Fonction de débogage pour nettoyer le localStorage
  clearAllAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole'); // Supprimer cette clé obsolète
    localStorage.removeItem('clientName'); // Supprimer cette clé obsolète
    console.log('clearAllAuthData - All auth data cleared');
  },

  // Fonction de validation et correction des données utilisateur
  validateAndFixUserData(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.log('validateAndFixUserData - No user data in localStorage');
      return null;
    }

    try {
      const user = JSON.parse(userStr);
      console.log('validateAndFixUserData - Parsed user:', user);

      // Vérifier que l'utilisateur a les champs requis
      if (!user || !user.id || !user.email) {
        console.log('validateAndFixUserData - Invalid user structure, clearing auth');
        this.clearAllAuthData();
        return null;
      }

      // L'utilisateur est valide
      console.log('validateAndFixUserData - User is valid');
      return user;
    } catch (error) {
      console.error('validateAndFixUserData - Error parsing user data:', error);
      this.clearAllAuthData();
      return null;
    }
  },

  // Inscription
  async register(data: RegisterRequest): Promise<User> {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  // Connexion
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/users/login', data);
    if (response.data.token && response.data.user) {
        console.log('Login successful, storing user data:', response.data.user);
        
        // Ensure user data has the correct structure
        const userData = {
          id: response.data.user.id,
          email: response.data.user.email,
          displayName: response.data.user.displayName || 'User',
          profilePictureUrl: response.data.user.profilePictureUrl,
          isSuperAdmin: response.data.user.isSuperAdmin || false,
          role: response.data.user.role,
          createdAt: response.data.user.createdAt,
          updatedAt: response.data.user.updatedAt
        };
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        console.log('User data stored in localStorage:', userData);
    }
    return response.data;
  },

  // Déconnexion
  logout() {
    this.clearAllAuthData();
  },

  // Récupérer l'utilisateur courant
  getCurrentUser(): User | null {
    return this.validateAndFixUserData();
  }
};