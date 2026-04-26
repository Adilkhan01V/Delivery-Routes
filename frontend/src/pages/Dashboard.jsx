import React, { useEffect, useState } from 'react';
import { 
  MapPin, 
  Route, 
  TrendingUp, 
  Clock,
  RefreshCw,
  Loader
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getDeliveries, generateDeliveries } from '../api';

const Dashboard = ({ theme, addToast }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getDeliveries();
      setDeliveries(data);
    } catch (error) {
      addToast('Failed to load deliveries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRandomize = async (count = 20) => {
    setGenerating(true);
    try {
      await generateDeliveries(count);
      await fetchData();
      addToast(`Generated ${count} new deliveries`, 'success');
    } catch (error) {
      addToast('Failed to generate deliveries', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const priorityData = [
    { name: 'High', value: deliveries.filter(d => d.priority === 'high').length, color: '#ef4444' },
    { name: 'Medium', value: deliveries.filter(d => d.priority === 'medium').length, color: '#f59e0b' },
    { name: 'Low', value: deliveries.filter(d => d.priority === 'low').length, color: '#10b981' },
  ].filter(d => d.value > 0);

  const deadlineData = deliveries.slice(0, 10).map((d, i) => ({
    name: `#${d.id}`,
    deadline: d.deadline_min,
  }));

  const avgDeadline = deliveries.length > 0 
    ? Math.round(deliveries.reduce((sum, d) => sum + d.deadline_min, 0) / deliveries.length)
    : 0;

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '50vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon blue">
              <MapPin size={24} />
            </div>
          </div>
          <div className="stat-value">{deliveries.length}</div>
          <div className="stat-label">Total Deliveries</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon orange">
              <Clock size={24} />
            </div>
          </div>
          <div className="stat-value">{avgDeadline}</div>
          <div className="stat-label">Avg. Deadline (min)</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon green">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="stat-value">{priorityData.length}</div>
          <div className="stat-label">Priority Levels</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon purple">
              <Route size={24} />
            </div>
          </div>
          <div className="stat-value">{deliveries.length > 0 ? 'Active' : 'None'}</div>
          <div className="stat-label">Route Status</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">Priority Distribution</h2>
          </div>
          {priorityData.length > 0 ? (
            <div style={{ height: 250, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-secondary)', 
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                        borderRadius: '8px'
                      }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '12px', 
                marginTop: '10px',
                flexWrap: 'wrap',
                padding: '0 10px'
              }}>
                {priorityData.map((entry) => (
                  <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: entry.color }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                      {entry.name}: {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state-text">No delivery data available</p>
            </div>
          )}
        </div>

        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">Delivery Deadlines</h2>
          </div>
          {deadlineData.length > 0 ? (
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deadlineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} 
                    axisLine={{ stroke: 'var(--border-color)' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                    axisLine={{ stroke: 'var(--border-color)' }}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-secondary)', 
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-md)'
                    }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Bar dataKey="deadline" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state-text">No delivery data available</p>
            </div>
          )}
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title">Quick Actions</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => handleRandomize(20)}
            disabled={generating}
          >
            {generating ? <Loader size={16} className="spinner" /> : <RefreshCw size={16} />}
            Generate 20 Deliveries
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => handleRandomize(50)}
            disabled={generating}
          >
            {generating ? <Loader size={16} /> : <RefreshCw size={16} />}
            Generate 50 Deliveries
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => handleRandomize(100)}
            disabled={generating}
          >
            {generating ? <Loader size={16} /> : <RefreshCw size={16} />}
            Generate 100 Deliveries
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
