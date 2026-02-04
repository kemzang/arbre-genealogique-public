import { memo, useState } from 'react';
import { 
  Users, 
  Search, 
  Shield, 
  ShieldCheck, 
  Crown, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  Calendar,
  Activity
} from 'lucide-react';
import { type AdminUser } from '../../services/admin.service';

interface UsersManagementProps {
  users: AdminUser[];
  loading: boolean;
  page: number;
  total: number;
  search: string;
  onSearch: (search: string) => void;
  onPageChange: (page: number) => void;
  onPromoteUser: (userId: number) => Promise<{ success: boolean; message: string }>;
  onDemoteUser: (userId: number) => Promise<{ success: boolean; message: string }>;
  onDeleteUser: (userId: number) => Promise<{ success: boolean; message: string }>;
}

export const UsersManagement = memo(({
  users,
  loading,
  page,
  total,
  search,
  onSearch,
  onPageChange,
  onPromoteUser,
  onDemoteUser,
  onDeleteUser
}: UsersManagementProps) => {
  const [searchInput, setSearchInput] = useState(search);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleUserAction = async (
    userId: number, 
    action: 'promote' | 'demote' | 'delete',
    actionFn: (userId: number) => Promise<{ success: boolean; message: string }>
  ) => {
    if (action === 'delete') {
      const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.');
      if (!confirmed) return;
    }

    setActionLoading(userId);
    try {
      const result = await actionFn(userId);
      if (result.success) {
        alert(result.message);
      } else {
        alert(`Erreur: ${result.message}`);
      }
    } catch (error) {
      alert('Une erreur est survenue');
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return Crown;
      case 'ADMIN': return ShieldCheck;
      default: return Shield;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return '#f59e0b';
      case 'ADMIN': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil((total || 0) / 20);

  return (
    <div className="users-management">
      <div className="users-header">
        <h3>
          <Users size={20} />
          Gestion des Utilisateurs ({(total || 0).toLocaleString()})
        </h3>

        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input">
            <Search size={16} />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit">Rechercher</button>
        </form>
      </div>

      <div className="users-table-container">
        {loading ? (
          <div className="users-loading">
            <div className="loader"></div>
            <p>Chargement des utilisateurs...</p>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Familles</th>
                <th>Inscription</th>
                <th>Dernière Connexion</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users && users.length > 0 ? users.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                const roleColor = getRoleColor(user.role);
                const isLoading = actionLoading === user.id;

                return (
                  <tr key={user.id} className={!user.isActive ? 'inactive' : ''}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.displayName[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="user-name">{user.displayName}</div>
                          <div className="user-email">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td>
                      <div className="user-role" style={{ color: roleColor }}>
                        <RoleIcon size={16} />
                        {user.role.replace('_', ' ')}
                      </div>
                    </td>
                    
                    <td>
                      <span className="families-count">{user.familiesCount}</span>
                    </td>
                    
                    <td>
                      <div className="date-info">
                        <Calendar size={14} />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    
                    <td>
                      {user.lastLoginAt ? (
                        <div className="date-info">
                          <Activity size={14} />
                          {formatDate(user.lastLoginAt)}
                        </div>
                      ) : (
                        <span className="no-login">Jamais connecté</span>
                      )}
                    </td>
                    
                    <td>
                      <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    
                    <td>
                      <div className="user-actions">
                        {user.role === 'USER' && (
                          <button
                            className="action-btn promote"
                            onClick={() => handleUserAction(user.id, 'promote', onPromoteUser)}
                            disabled={isLoading}
                            title="Promouvoir en Admin"
                          >
                            <ChevronUp size={16} />
                          </button>
                        )}
                        
                        {user.role === 'ADMIN' && (
                          <button
                            className="action-btn demote"
                            onClick={() => handleUserAction(user.id, 'demote', onDemoteUser)}
                            disabled={isLoading}
                            title="Rétrograder en User"
                          >
                            <ChevronDown size={16} />
                          </button>
                        )}
                        
                        {user.role !== 'SUPER_ADMIN' && (
                          <button
                            className="action-btn delete"
                            onClick={() => handleUserAction(user.id, 'delete', onDeleteUser)}
                            disabled={isLoading}
                            title="Supprimer l'utilisateur"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        
                        {isLoading && <div className="action-loader"></div>}
                      </div>
                    </td>
                  </tr>
                );
              }) : null}
            </tbody>
          </table>
        )}

        {!loading && users.length === 0 && (
          <div className="users-empty">
            <Users size={48} color="#9ca3af" />
            <p>Aucun utilisateur trouvé</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="pagination-btn"
          >
            Précédent
          </button>
          
          <span className="pagination-info">
            Page {page} sur {totalPages}
          </span>
          
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="pagination-btn"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
});