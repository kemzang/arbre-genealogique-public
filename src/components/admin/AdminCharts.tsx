import { memo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  type TimelineData, 
  type DistributionData, 
  type EngagementData
} from '../../services/admin.service';

interface AdminChartsProps {
  timelineData: TimelineData[];
  distributionData: DistributionData | null;
  engagementData: EngagementData | null;
  loading: boolean;
}

export const AdminCharts = memo(({ 
  timelineData, 
  distributionData, 
  engagementData, 
  loading 
}: AdminChartsProps) => {
  if (loading) {
    return (
      <div className="admin-charts loading">
        <div className="charts-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="chart-card skeleton">
              <div className="chart-skeleton"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Si aucune donnée n'est disponible, afficher un message informatif
  if (!Array.isArray(timelineData) || timelineData.length === 0) {
    return (
      <div className="admin-charts">
        <div className="charts-grid">
          <div className="chart-card full-width">
            <div className="chart-header">
              <h3>Données en cours de chargement</h3>
              <p>Les graphiques seront affichés une fois les données récupérées depuis le backend.</p>
            </div>
            <div className="chart-container" style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="loader"></div>
              <p style={{ marginTop: '1rem', color: '#64748b' }}>
                Récupération des données en cours...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Préparer les données pour les graphiques
  const timelineChartData = Array.isArray(timelineData) && timelineData.length > 0 ? timelineData.map(item => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
    utilisateurs: item.users || 0,
    familles: item.families || 0,
    messages: item.messages || 0,
    medias: item.medias || 0
  })) : [];

  const userDistribution = distributionData?.roles ? [
    { name: 'Utilisateurs', value: distributionData.roles.USER || 0, color: '#3b82f6' },
    { name: 'Admins', value: distributionData.roles.ADMIN || 0, color: '#10b981' },
    { name: 'Super-Admins', value: distributionData.roles.SUPER_ADMIN || 0, color: '#f59e0b' }
  ] : [];

  const familySizes = distributionData?.familySizes ? [
    { size: '1-5 membres', count: distributionData.familySizes['1-5'] || 0, color: '#8b5cf6' },
    { size: '6-10 membres', count: distributionData.familySizes['6-10'] || 0, color: '#06b6d4' },
    { size: '11-20 membres', count: distributionData.familySizes['11-20'] || 0, color: '#84cc16' },
    { size: '20+ membres', count: distributionData.familySizes['20+'] || 0, color: '#ef4444' }
  ] : [];

  const activityHours = distributionData?.hourlyActivity && Array.isArray(distributionData.hourlyActivity) ? 
    distributionData.hourlyActivity.map(item => ({
      hour: `${item.hour}h`,
      activite: item.activity || 0
    })) : [];

  const engagementChartData = engagementData ? [
    { status: 'Très actifs', count: engagementData.veryActive || 0, color: '#10b981' },
    { status: 'Actifs', count: engagementData.active || 0, color: '#3b82f6' },
    { status: 'Peu actifs', count: engagementData.lowActive || 0, color: '#f59e0b' },
    { status: 'Inactifs', count: engagementData.inactive || 0, color: '#ef4444' }
  ] : [];

  return (
    <div className="admin-charts">
      <div className="charts-grid">
        
        {/* Évolution des Utilisateurs */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Évolution des Utilisateurs (30 jours)</h3>
            <p>Croissance quotidienne des inscriptions</p>
          </div>
          <div className="chart-container">
            {timelineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timelineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="utilisateurs"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>

        {/* Répartition des Rôles */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Répartition des Rôles</h3>
            <p>Distribution des utilisateurs par rôle</p>
          </div>
          <div className="chart-container">
            {userDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {userDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Pourcentage']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>

        {/* Activité par Heure */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Activité par Heure</h3>
            <p>Répartition de l'activité sur 24h</p>
          </div>
          <div className="chart-container">
            {activityHours.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="activite" 
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>

        {/* Taille des Familles */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Taille des Familles</h3>
            <p>Distribution par nombre de membres</p>
          </div>
          <div className="chart-container">
            {familySizes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={familySizes} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis 
                    type="category" 
                    dataKey="size" 
                    stroke="#64748b"
                    fontSize={12}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>

        {/* Engagement des Utilisateurs */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Engagement des Utilisateurs</h3>
            <p>Niveau d'activité des utilisateurs</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={engagementChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="count"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {engagementChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [value, 'Utilisateurs']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Évolution Multi-Métriques */}
        <div className="chart-card full-width">
          <div className="chart-header">
            <h3>Évolution Globale</h3>
            <p>Suivi des principales métriques sur 30 jours</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={timelineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="utilisateurs"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  name="Nouveaux Utilisateurs"
                />
                <Line
                  type="monotone"
                  dataKey="familles"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  name="Nouvelles Familles"
                />
                <Line
                  type="monotone"
                  dataKey="messages"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  name="Messages"
                />
                <Line
                  type="monotone"
                  dataKey="medias"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                  name="Médias"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
});