import { useState, useCallback } from 'react';
import { 
  adminService, 
  type AdminStats, 
  type ActivityLog, 
  type AdminUser, 
  type AdminFamily,
  type TimelineData,
  type DistributionData,
  type EngagementData,
  type SystemData
} from '../services/admin.service';

export const useAdminData = () => {
  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Charts data
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [distributionData, setDistributionData] = useState<DistributionData | null>(null);
  const [engagementData, setEngagementData] = useState<EngagementData | null>(null);
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [chartsLoading, setChartsLoading] = useState(false);

  // Activity
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);

  // Users
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersSearch, setUsersSearch] = useState('');

  // Families
  const [families, setFamilies] = useState<AdminFamily[]>([]);
  const [familiesLoading, setFamiliesLoading] = useState(false);
  const [familiesPage, setFamiliesPage] = useState(1);
  const [familiesTotal, setFamiliesTotal] = useState(0);
  const [familiesSearch, setFamiliesSearch] = useState('');

  // Load Stats
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load Charts Data
  const loadChartsData = useCallback(async () => {
    setChartsLoading(true);
    try {
      const [timeline, distribution, engagement, system] = await Promise.all([
        adminService.getTimeline('30d'),
        adminService.getDistribution(),
        adminService.getEngagement(),
        adminService.getSystemStats()
      ]);

      setTimelineData(Array.isArray(timeline) ? timeline : []);
      setDistributionData(distribution || null);
      setEngagementData(engagement || null);
      setSystemData(system || null);
    } catch (error) {
      console.error('Error loading charts data:', error);
      // Set safe fallback values
      setTimelineData([]);
      setDistributionData(null);
      setEngagementData(null);
      setSystemData(null);
    } finally {
      setChartsLoading(false);
    }
  }, []);

  // Load Activity
  const loadActivity = useCallback(async (page = 1, append = false) => {
    setActivityLoading(true);
    try {
      const response = await adminService.getActivity(page, 50);
      if (append) {
        setActivities(prev => [...(prev || []), ...(response.data || [])]);
      } else {
        setActivities(response.data || []);
      }
      setActivityPage(page);
      setActivityTotal(response.total || 0);
    } catch (error) {
      console.error('Error loading activity:', error);
      if (!append) {
        setActivities([]);
        setActivityTotal(0);
      }
    } finally {
      setActivityLoading(false);
    }
  }, []);

  // Load Users
  const loadUsers = useCallback(async (page = 1, search = '') => {
    setUsersLoading(true);
    try {
      const response = await adminService.getUsers(page, 20, search);
      setUsers(response.data || []);
      setUsersPage(page);
      setUsersTotal(response.total || 0);
      setUsersSearch(search);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
      setUsersTotal(0);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Load Families
  const loadFamilies = useCallback(async (page = 1, search = '') => {
    setFamiliesLoading(true);
    try {
      const response = await adminService.getFamilies(page, 20, search);
      setFamilies(response.data || []);
      setFamiliesPage(page);
      setFamiliesTotal(response.total || 0);
      setFamiliesSearch(search);
    } catch (error) {
      console.error('Error loading families:', error);
      setFamilies([]);
      setFamiliesTotal(0);
    } finally {
      setFamiliesLoading(false);
    }
  }, []);

  // User Actions
  const promoteUser = useCallback(async (userId: number) => {
    try {
      const result = await adminService.promoteUser(userId);
      if (result.success) {
        await loadUsers(usersPage, usersSearch);
        return { success: true, message: result.message };
      }
      return { success: false, message: result.message };
    } catch (error) {
      console.error('Error promoting user:', error);
      return { success: false, message: 'Erreur lors de la promotion' };
    }
  }, [loadUsers, usersPage, usersSearch]);

  const demoteUser = useCallback(async (userId: number) => {
    try {
      const result = await adminService.demoteUser(userId);
      if (result.success) {
        await loadUsers(usersPage, usersSearch);
        return { success: true, message: result.message };
      }
      return { success: false, message: result.message };
    } catch (error) {
      console.error('Error demoting user:', error);
      return { success: false, message: 'Erreur lors de la rétrogradation' };
    }
  }, [loadUsers, usersPage, usersSearch]);

  const deleteUser = useCallback(async (userId: number) => {
    try {
      const result = await adminService.deleteUser(userId);
      if (result.success) {
        await loadUsers(usersPage, usersSearch);
        await loadStats(); // Refresh stats
        return { success: true, message: result.message };
      }
      return { success: false, message: result.message };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, message: 'Erreur lors de la suppression' };
    }
  }, [loadUsers, usersPage, usersSearch, loadStats]);

  // Family Actions
  const deleteFamily = useCallback(async (familyId: number) => {
    try {
      const result = await adminService.deleteFamily(familyId);
      if (result.success) {
        await loadFamilies(familiesPage, familiesSearch);
        await loadStats(); // Refresh stats
        return { success: true, message: result.message };
      }
      return { success: false, message: result.message };
    } catch (error) {
      console.error('Error deleting family:', error);
      return { success: false, message: 'Erreur lors de la suppression' };
    }
  }, [loadFamilies, familiesPage, familiesSearch, loadStats]);

  return {
    // Stats
    stats,
    statsLoading,
    loadStats,

    // Charts
    timelineData,
    distributionData,
    engagementData,
    systemData,
    chartsLoading,
    loadChartsData,

    // Activity
    activities,
    activityLoading,
    activityPage,
    activityTotal,
    loadActivity,

    // Users
    users,
    usersLoading,
    usersPage,
    usersTotal,
    usersSearch,
    loadUsers,
    promoteUser,
    demoteUser,
    deleteUser,

    // Families
    families,
    familiesLoading,
    familiesPage,
    familiesTotal,
    familiesSearch,
    loadFamilies,
    deleteFamily
  };
};