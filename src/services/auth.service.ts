import api from './api';

// Types pour les requêtes
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  // Inscription
  async register(data: RegisterRequest): Promise<User> {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  // Connexion
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/users/login', data);
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Déconnexion
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Récupérer l'utilisateur courant
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  }
};
