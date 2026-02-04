import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Home, 
  Activity, 
  LogOut,
  Shield
} from 'lucide-react';

// Hooks
import { useAdminData } from '../../hooks/useAdminData';

// Components
import { AdminStats } from '../../components/admin/AdminStats';
import { AdminCharts } from '../../components/admin/AdminCharts';
import { ActivityFeed } from '../../components/admin/ActivityFeed';
import { UsersManagement } from '../../components/admin/UsersManagement';
import { FamiliesManagement } from '../../components/admin/FamiliesManagement';

// Services
import { authService, type User } from '../../services/auth.service';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'STATS' | 'ACTIVITY' | 'USERS' | 'FAMILIES'>('STATS');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const adminData = useAdminData();

  // Initialize admin user
  useEffect(() => {
    const currentUser = authService.validateAndFixUserData();
    if (!currentUser) {
      navigate('/');
      return;
    }

    console.log('AdminDashboard - Validated user:', currentUser);

    // Vérifier que l'utilisateur est bien super-admin
    if (!authService.isSuperAdmin(currentUser)) {
      alert('Accès refusé. Vous devez être Super-Admin pour accéder à cette page.');
      navigate('/dashboard');
      return;
    }
    
    setUser(currentUser);
    
    // Load initial data
    adminData.loadStats();
    adminData.loadActivity();
  }, [navigate]);

  // Load data when tab changes
  useEffect(() => {
    switch (activeTab) {
      case 'USERS':
        if (!adminData.users || adminData.users.length === 0) {
          adminData.loadUsers();
        }
        break;
      case 'FAMILIES':
        if (!adminData.families || adminData.families.length === 0) {
          adminData.loadFamilies();
        }
        break;
      case 'ACTIVITY':
        if (!adminData.activities || adminData.activities.length === 0) {
          adminData.loadActivity();
        }
        break;
    }
  }, [activeTab]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    authService.logout();
    navigate('/');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleLoadMoreActivity = () => {
    const nextPage = adminData.activityPage + 1;
    adminData.loadActivity(nextPage, true);
  };

  const hasMoreActivity = (adminData.activities?.length || 0) < adminData.activityTotal;

  if (!user) {
    return (
      <div className="loader-page">
        <span className="loader"></span>
        <p>Vérification des permissions...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-brand">
          <Shield size={24} color="#f59e0b" />
          <h1>Administration</h1>
        </div>
        
        <nav className="admin-nav">
          <button 
            className={`nav-btn ${activeTab === 'STATS' ? 'active' : ''}`}
            onClick={() => setActiveTab('STATS')}
          >
            <BarChart3 size={16} />
            Statistiques
          </button>
          
          <button 
            className={`nav-btn ${activeTab === 'ACTIVITY' ? 'active' : ''}`}
            onClick={() => setActiveTab('ACTIVITY')}
          >
            <Activity size={16} />
            Activité
          </button>
          
          <button 
            className={`nav-btn ${activeTab === 'USERS' ? 'active' : ''}`}
            onClick={() => setActiveTab('USERS')}
          >
            <Users size={16} />
            Utilisateurs
          </button>
          
          <button 
            className={`nav-btn ${activeTab === 'FAMILIES' ? 'active' : ''}`}
            onClick={() => setActiveTab('FAMILIES')}
          >
            <Home size={16} />
            Familles
          </button>
        </nav>

        <div className="admin-user">
          <div className="admin-profile">
            <div className="admin-avatar">
              {user.displayName?.[0]?.toUpperCase() || 'S'}
            </div>
            <div className="admin-info">
              <span className="admin-name">{user.displayName}</span>
              <span className="admin-role">Super-Admin</span>
            </div>
          </div>
          
          <button className="logout-btn" onClick={handleLogout} title="Déconnexion">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        {activeTab === 'STATS' && (
          <div className="admin-content">
            <AdminStats 
              stats={adminData.stats} 
              loading={adminData.statsLoading} 
            />
            
            <AdminCharts 
              stats={adminData.stats} 
              loading={adminData.statsLoading} 
            />
          </div>
        )}

        {activeTab === 'ACTIVITY' && (
          <div className="admin-content">
            <ActivityFeed
              activities={adminData.activities}
              loading={adminData.activityLoading}
              onLoadMore={handleLoadMoreActivity}
              hasMore={hasMoreActivity}
            />
          </div>
        )}

        {activeTab === 'USERS' && (
          <div className="admin-content">
            <UsersManagement
              users={adminData.users}
              loading={adminData.usersLoading}
              page={adminData.usersPage}
              total={adminData.usersTotal}
              search={adminData.usersSearch}
              onSearch={(search) => adminData.loadUsers(1, search)}
              onPageChange={(page) => adminData.loadUsers(page, adminData.usersSearch)}
              onPromoteUser={adminData.promoteUser}
              onDemoteUser={adminData.demoteUser}
              onDeleteUser={adminData.deleteUser}
            />
          </div>
        )}

        {activeTab === 'FAMILIES' && (
          <div className="admin-content">
            <FamiliesManagement
              families={adminData.families}
              loading={adminData.familiesLoading}
              page={adminData.familiesPage}
              total={adminData.familiesTotal}
              search={adminData.familiesSearch}
              onSearch={(search) => adminData.loadFamilies(1, search)}
              onPageChange={(page) => adminData.loadFamilies(page, adminData.familiesSearch)}
              onDeleteFamily={adminData.deleteFamily}
            />
          </div>
        )}
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-content logout-modal">
            <div className="logout-icon">
              <LogOut size={48} color="#e74c3c" />
            </div>
            <h2>Confirmer la déconnexion</h2>
            <p>Êtes-vous sûr de vouloir vous déconnecter du panneau d'administration ?</p>
            <div className="logout-actions">
              <button className="cancel-btn" onClick={cancelLogout}>
                Annuler
              </button>
              <button className="confirm-btn" onClick={confirmLogout}>
                <LogOut size={16} />
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}