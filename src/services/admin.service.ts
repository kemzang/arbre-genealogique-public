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

// Types pour les données temporelles
export interface TimelineData {
  date: string;
  users: number;
  families: number;
  messages: number;
  medias: number;
}

// Types pour la répartition
export interface DistributionData {
  roles: {
    USER: number;
    ADMIN: number;
    SUPER_ADMIN: number;
  };
  familySizes: {
    "1-5": number;
    "6-10": number;
    "11-20": number;
    "20+": number;
  };
  mediaTypes: {
    images: number;
    videos: number;
    documents: number;
  };
  hourlyActivity: Array<{
    hour: number;
    activity: number;
  }>;
}

// Types pour l'engagement
export interface EngagementData {
  veryActive: number;
  active: number;
  lowActive: number;
  inactive: number;
  topFamilies: Array<{
    id: number;
    name: string;
    activity: number;
    membersCount: number;
  }>;
}

// Types pour le système
export interface SystemData {
  storage: {
    total: string;
    used: string;
    byType: {
      images: string;
      videos: string;
      documents: string;
    };
  };
  performance: {
    avgResponseTime: number;
    uptime: string;
    errorRate: number;
  };
  traffic: Array<{
    hour: number;
    requests: number;
  }>;
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

  async getTimeline(period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<TimelineData[]> {
    try {
      const response = await api.get(`/admin/stats/timeline?period=${period}`);
      return response.data;
    } catch (error) {
      console.warn('Admin timeline endpoint not available, using mock data');
      // Générer des données de démonstration
      const data: TimelineData[] = [];
      const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
      const today = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        data.push({
          date: date.toISOString().split('T')[0],
          users: Math.floor(Math.random() * 20) + 5,
          families: Math.floor(Math.random() * 8) + 1,
          messages: Math.floor(Math.random() * 150) + 50,
          medias: Math.floor(Math.random() * 30) + 10
        });
      }
      
      return data;
    }
  }

  async getDistribution(): Promise<DistributionData> {
    try {
      const response = await api.get('/admin/stats/distribution');
      return response.data;
    } catch (error) {
      console.warn('Admin distribution endpoint not available, using mock data');
      return {
        roles: {
          USER: 85,
          ADMIN: 12,
          SUPER_ADMIN: 3
        },
        familySizes: {
          "1-5": 45,
          "6-10": 28,
          "11-20": 15,
          "20+": 8
        },
        mediaTypes: {
          images: 65,
          videos: 25,
          documents: 10
        },
        hourlyActivity: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          activity: Math.floor(Math.random() * 100) + (i >= 8 && i <= 22 ? 50 : 10)
        }))
      };
    }
  }

  async getEngagement(): Promise<EngagementData> {
    try {
      const response = await api.get('/admin/stats/engagement');
      return response.data;
    } catch (error) {
      console.warn('Admin engagement endpoint not available, using mock data');
      return {
        veryActive: 35,
        active: 42,
        lowActive: 18,
        inactive: 12,
        topFamilies: [
          { id: 1, name: 'Famille Martin', activity: 95, membersCount: 12 },
          { id: 2, name: 'Famille Dubois', activity: 87, membersCount: 8 },
          { id: 3, name: 'Famille Leroy', activity: 76, membersCount: 15 },
          { id: 4, name: 'Famille Bernard', activity: 68, membersCount: 6 },
          { id: 5, name: 'Famille Petit', activity: 62, membersCount: 9 }
        ]
      };
    }
  }

  async getSystemStats(): Promise<SystemData> {
    try {
      const response = await api.get('/admin/stats/system');
      return response.data;
    } catch (error) {
      console.warn('Admin system endpoint not available, using mock data');
      return {
        storage: {
          total: '10 GB',
          used: '3.2 GB',
          byType: {
            images: '2.1 GB',
            videos: '800 MB',
            documents: '300 MB'
          }
        },
        performance: {
          avgResponseTime: 245,
          uptime: '99.8%',
          errorRate: 0.2
        },
        traffic: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          requests: Math.floor(Math.random() * 500) + (i >= 8 && i <= 22 ? 200 : 50)
        }))
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