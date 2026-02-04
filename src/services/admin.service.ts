import api from './api';

// Types pour les statistiques admin
export interface AdminStats {
  totalUsers: number;
  totalFamilies: number;
  totalMessages: number;
  totalMediaFiles: number;
  activeUsersToday: number;
  newUsersThisWeek: number;
  storageUsed: string;
}

// Types pour l'activité
export interface ActivityLog {
  id: number;
  userId: number;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

// Types pour la gestion des utilisateurs
export interface AdminUser {
  id: number;
  email: string;
  displayName: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  familiesCount: number;
}

// Types pour la gestion des familles
export interface AdminFamily {
  id: number;
  name: string;
  createdAt: string;
  membersCount: number;
  adminName: string;
  messagesCount: number;
  mediaCount: number;
  lastActivity?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class AdminService {
  // Dashboard & Statistiques
  async getStats(): Promise<AdminStats> {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error) {
      console.warn('Admin stats endpoint not available, using mock data');
      // Retourner des données de test si l'endpoint n'existe pas
      return {
        totalUsers: 0,
        totalFamilies: 0,
        totalMessages: 0,
        totalMediaFiles: 0,
        activeUsersToday: 0,
        newUsersThisWeek: 0,
        storageUsed: '0 MB'
      };
    }
  }

  async getActivity(page = 1, limit = 50): Promise<PaginatedResponse<ActivityLog>> {
    try {
      const response = await api.get(`/admin/activity?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.warn('Admin activity endpoint not available, using mock data');
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0
      };
    }
  }

  // Gestion des utilisateurs
  async getUsers(page = 1, limit = 20, search?: string): Promise<PaginatedResponse<AdminUser>> {
    try {
      let url = `/admin/users?page=${page}&limit=${limit}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.warn('Admin users endpoint not available, using mock data');
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
      };
    }
  }

  async promoteUser(userId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.patch(`/admin/users/${userId}`, { action: 'promote' });
      return response.data;
    } catch (error) {
      console.warn('Admin promote user endpoint not available');
      return { success: false, message: 'Endpoint non disponible' };
    }
  }

  async demoteUser(userId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.patch(`/admin/users/${userId}`, { action: 'demote' });
      return response.data;
    } catch (error) {
      console.warn('Admin demote user endpoint not available');
      return { success: false, message: 'Endpoint non disponible' };
    }
  }

  async deleteUser(userId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.warn('Admin delete user endpoint not available');
      return { success: false, message: 'Endpoint non disponible' };
    }
  }

  // Gestion des familles
  async getFamilies(page = 1, limit = 20, search?: string): Promise<PaginatedResponse<AdminFamily>> {
    try {
      let url = `/admin/families?page=${page}&limit=${limit}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.warn('Admin families endpoint not available, using mock data');
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
      };
    }
  }

  async deleteFamily(familyId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/admin/families/${familyId}`);
      return response.data;
    } catch (error) {
      console.warn('Admin delete family endpoint not available');
      return { success: false, message: 'Endpoint non disponible' };
    }
  }
}

export const adminService = new AdminService();