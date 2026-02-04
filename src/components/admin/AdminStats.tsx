import { memo } from 'react';
import { Users, Home, MessageCircle, Image, Activity, UserPlus, HardDrive } from 'lucide-react';
import { type AdminStats as AdminStatsType } from '../../services/admin.service';

interface AdminStatsProps {
  stats: AdminStatsType | null;
  loading: boolean;
}

export const AdminStats = memo(({ stats, loading }: AdminStatsProps) => {
  if (loading) {
    return (
      <div className="admin-stats loading">
        <div className="stats-grid">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="stat-card skeleton">
              <div className="stat-icon skeleton-icon"></div>
              <div className="stat-content">
                <div className="stat-value skeleton-text"></div>
                <div className="stat-label skeleton-text"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="admin-stats error">
        <p>Impossible de charger les statistiques</p>
      </div>
    );
  }

  const statItems = [
    {
      icon: Users,
      value: (stats?.totalUsers || 0).toLocaleString(),
      label: 'Utilisateurs Total',
      color: '#3b82f6'
    },
    {
      icon: Home,
      value: (stats?.totalFamilies || 0).toLocaleString(),
      label: 'Familles',
      color: '#10b981'
    },
    {
      icon: MessageCircle,
      value: (stats?.totalMessages || 0).toLocaleString(),
      label: 'Messages',
      color: '#8b5cf6'
    },
    {
      icon: Image,
      value: (stats?.totalMediaFiles || 0).toLocaleString(),
      label: 'Fichiers Médias',
      color: '#f59e0b'
    },
    {
      icon: Activity,
      value: (stats?.activeUsersToday || 0).toLocaleString(),
      label: 'Actifs Aujourd\'hui',
      color: '#ef4444'
    },
    {
      icon: UserPlus,
      value: (stats?.newUsersThisWeek || 0).toLocaleString(),
      label: 'Nouveaux (7j)',
      color: '#06b6d4'
    },
    {
      icon: HardDrive,
      value: stats?.storageUsed || '0 MB',
      label: 'Stockage Utilisé',
      color: '#84cc16'
    }
  ];

  return (
    <div className="admin-stats">
      <div className="stats-grid">
        {statItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                <IconComponent size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{item.value}</div>
                <div className="stat-label">{item.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});