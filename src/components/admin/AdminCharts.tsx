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
import { type AdminStats } from '../../services/admin.service';

interface AdminChartsProps {
  stats: AdminStats | null;
  loading: boolean;
}

// Données de démonstration - seront remplacées par les vraies données
const generateTimelineData = () => {
  const data = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
      utilisateurs: Math.floor(Math.random() * 20) + 5,
      familles: Math.floor(Math.random() * 8) + 1,
      messages: Math.floor(Math.random() * 150) + 50,
      medias: Math.floor(Math.random() * 30) + 10
    });
  }
  
  return data;
};

const generateUserDistribution = () => [
  { name: 'Utilisateurs', value: 85, color: '#3b82f6' },
  { name: 'Admins', value: 12, color: '#10b981' },
  { name: 'Super-Admins', value: 3, color: '#f59e0b' }
];

const generateFamilySizes = () => [
  { size: '1-5 membres', count: 45, color: '#8b5cf6' },
  { size: '6-10 membres', count: 28, color: '#06b6d4' },
  { size: '11-20 membres', count: 15, color: '#84cc16' },
  { size: '20+ membres', count: 8, color: '#ef4444' }
];

const generateActivityHours = () => {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    hours.push({
      hour: `${i}h`,
      activite: Math.floor(Math.random() * 100) + (i >= 8 && i <= 22 ? 50 : 10)
    });
  }
  return hours;
};

const generateEngagementData = () => [
  { status: 'Très actifs', count: 35, color: '#10b981' },
  { status: 'Actifs', count: 42, color: '#3b82f6' },
  { status: 'Peu actifs', count: 18, color: '#f59e0b' },
  { status: 'Inactifs', count: 12, color: '#ef4444' }
];

export const AdminCharts = memo(({ loading }: AdminChartsProps) => {
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

  const timelineData = generateTimelineData();
  const userDistribution = generateUserDistribution();
  const familySizes = generateFamilySizes();
  const activityHours = generateActivityHours();
  const engagementData = generateEngagementData();

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
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timelineData}>
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
          </div>
        </div>

        {/* Répartition des Rôles */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Répartition des Rôles</h3>
            <p>Distribution des utilisateurs par rôle</p>
          </div>
          <div className="chart-container">
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
          </div>
        </div>

        {/* Activité par Heure */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Activité par Heure</h3>
            <p>Répartition de l'activité sur 24h</p>
          </div>
          <div className="chart-container">
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
          </div>
        </div>

        {/* Taille des Familles */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Taille des Familles</h3>
            <p>Distribution par nombre de membres</p>
          </div>
          <div className="chart-container">
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
                  data={engagementData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="count"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {engagementData.map((entry, index) => (
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
              <LineChart data={timelineData}>
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