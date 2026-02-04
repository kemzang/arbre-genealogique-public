import { memo, useState } from 'react';
import { 
  Home, 
  Search, 
  Trash2, 
  Users, 
  MessageCircle, 
  Image, 
  Calendar,
  Activity
} from 'lucide-react';
import { type AdminFamily } from '../../services/admin.service';

interface FamiliesManagementProps {
  families: AdminFamily[];
  loading: boolean;
  page: number;
  total: number;
  search: string;
  onSearch: (search: string) => void;
  onPageChange: (page: number) => void;
  onDeleteFamily: (familyId: number) => Promise<{ success: boolean; message: string }>;
}

export const FamiliesManagement = memo(({
  families,
  loading,
  page,
  total,
  search,
  onSearch,
  onPageChange,
  onDeleteFamily
}: FamiliesManagementProps) => {
  const [searchInput, setSearchInput] = useState(search);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleDeleteFamily = async (familyId: number) => {
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette famille ? Cette action supprimera tous les membres, messages et médias associés. Cette action est irréversible.');
    if (!confirmed) return;

    setActionLoading(familyId);
    try {
      const result = await onDeleteFamily(familyId);
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
    <div className="families-management">
      <div className="families-header">
        <h3>
          <Home size={20} />
          Gestion des Familles ({(total || 0).toLocaleString()})
        </h3>

        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input">
            <Search size={16} />
            <input
              type="text"
              placeholder="Rechercher par nom de famille..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit">Rechercher</button>
        </form>
      </div>

      <div className="families-table-container">
        {loading ? (
          <div className="families-loading">
            <div className="loader"></div>
            <p>Chargement des familles...</p>
          </div>
        ) : (
          <table className="families-table">
            <thead>
              <tr>
                <th>Famille</th>
                <th>Administrateur</th>
                <th>Membres</th>
                <th>Messages</th>
                <th>Médias</th>
                <th>Créée le</th>
                <th>Dernière Activité</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {families && families.length > 0 ? families.map((family) => {
                const isLoading = actionLoading === family.id;

                return (
                  <tr key={family.id}>
                    <td>
                      <div className="family-info">
                        <div className="family-avatar">
                          <Home size={20} />
                        </div>
                        <div>
                          <div className="family-name">{family.name}</div>
                          <div className="family-id">ID: {family.id}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td>
                      <div className="admin-info">
                        <div className="admin-avatar">
                          {family.adminName[0].toUpperCase()}
                        </div>
                        <span>{family.adminName}</span>
                      </div>
                    </td>
                    
                    <td>
                      <div className="stat-item">
                        <Users size={16} />
                        <span>{family.membersCount}</span>
                      </div>
                    </td>
                    
                    <td>
                      <div className="stat-item">
                        <MessageCircle size={16} />
                        <span>{family.messagesCount.toLocaleString()}</span>
                      </div>
                    </td>
                    
                    <td>
                      <div className="stat-item">
                        <Image size={16} />
                        <span>{family.mediaCount.toLocaleString()}</span>
                      </div>
                    </td>
                    
                    <td>
                      <div className="date-info">
                        <Calendar size={14} />
                        {formatDate(family.createdAt)}
                      </div>
                    </td>
                    
                    <td>
                      {family.lastActivity ? (
                        <div className="date-info">
                          <Activity size={14} />
                          {formatDate(family.lastActivity)}
                        </div>
                      ) : (
                        <span className="no-activity">Aucune activité</span>
                      )}
                    </td>
                    
                    <td>
                      <div className="family-actions">
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeleteFamily(family.id)}
                          disabled={isLoading}
                          title="Supprimer la famille"
                        >
                          <Trash2 size={16} />
                        </button>
                        
                        {isLoading && <div className="action-loader"></div>}
                      </div>
                    </td>
                  </tr>
                );
              }) : null}
            </tbody>
          </table>
        )}

        {!loading && families.length === 0 && (
          <div className="families-empty">
            <Home size={48} color="#9ca3af" />
            <p>Aucune famille trouvée</p>
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