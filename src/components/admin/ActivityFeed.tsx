import { memo } from 'react';
import { Clock, User, Activity as ActivityIcon } from 'lucide-react';
import { type ActivityLog } from '../../services/admin.service';

interface ActivityFeedProps {
  activities: ActivityLog[];
  loading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
}

export const ActivityFeed = memo(({ activities, loading, onLoadMore, hasMore }: ActivityFeedProps) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('REGISTER')) return '#10b981';
    if (action.includes('DELETE') || action.includes('REMOVE')) return '#ef4444';
    if (action.includes('UPDATE') || action.includes('EDIT')) return '#f59e0b';
    if (action.includes('LOGIN')) return '#3b82f6';
    return '#6b7280';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('USER')) return User;
    return ActivityIcon;
  };

  return (
    <div className="activity-feed">
      <div className="activity-header">
        <h3>
          <ActivityIcon size={20} />
          Activité Récente
        </h3>
      </div>

      <div className="activity-list">
        {activities && activities.length > 0 ? activities.map((activity) => {
          const IconComponent = getActionIcon(activity.action);
          const actionColor = getActionColor(activity.action);

          return (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon" style={{ backgroundColor: `${actionColor}20`, color: actionColor }}>
                <IconComponent size={16} />
              </div>
              
              <div className="activity-content">
                <div className="activity-main">
                  <span className="activity-user">{activity.userName}</span>
                  <span className="activity-action">{activity.action}</span>
                </div>
                
                {activity.details && (
                  <div className="activity-details">{activity.details}</div>
                )}
                
                <div className="activity-meta">
                  <Clock size={12} />
                  <span>{formatTimestamp(activity.timestamp)}</span>
                  {activity.ipAddress && (
                    <span className="activity-ip">• {activity.ipAddress}</span>
                  )}
                </div>
              </div>
            </div>
          );
        }) : null}

        {loading && (
          <div className="activity-loading">
            <div className="loader-small"></div>
            <span>Chargement...</span>
          </div>
        )}

        {!loading && activities.length === 0 && (
          <div className="activity-empty">
            <ActivityIcon size={48} color="#9ca3af" />
            <p>Aucune activité récente</p>
          </div>
        )}

        {hasMore && !loading && (
          <button className="load-more-btn" onClick={onLoadMore}>
            Charger plus d'activités
          </button>
        )}
      </div>
    </div>
  );
});