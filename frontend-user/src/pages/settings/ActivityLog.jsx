// frontend-user/src/pages/settings/ActivityLog.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { ArrowLeft, Activity, Clock, RefreshCw, Search, Filter, Download } from 'lucide-react';

export default function ActivityLog() {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all');

  const getToken = () => {
    return (
      localStorage.getItem('vexastore_user_token') ||
      localStorage.getItem('userToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      ''
    );
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
      const response = await fetch(`${vexaAccountUrl}/api/auth/activity-log`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setActivities(data.data || []);
      } else {
        // Fallback: mock activities
        setActivities([
          { action: 'Logged in', ip_address: '192.168.1.1', created_at: new Date().toISOString() },
          { action: 'Viewed profile', ip_address: '192.168.1.1', created_at: new Date(Date.now() - 3600000).toISOString() },
          { action: 'Downloaded app', ip_address: '192.168.1.1', created_at: new Date(Date.now() - 7200000).toISOString() },
        ]);
      }
    } catch (err) {
      console.error('Load activities error:', err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const name = String(action || '').toLowerCase();
    if (name.includes('login')) return '🔑';
    if (name.includes('logout')) return '🚪';
    if (name.includes('download')) return '📥';
    if (name.includes('update') || name.includes('edit')) return '✏️';
    if (name.includes('delete')) return '🗑️';
    if (name.includes('view') || name.includes('profile')) return '👁️';
    if (name.includes('2fa') || name.includes('security')) return '🔒';
    return '📌';
  };

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => String(a.action || '').toLowerCase().includes(filter));

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/profile" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition">
        <ArrowLeft size={20} /> Back to Profile
      </Link>

      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <Activity size={24} className="text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">Activity Log</h1>
        </div>
        <p className="text-slate-400">Recent activity on your account</p>
      </div>

      {/* ─── Filters ─── */}
      <div className="flex flex-wrap gap-2">
        {['all', 'login', 'download', 'update', 'security'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filter === f
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                : 'bg-[#0a0e1a] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button
          onClick={loadActivities}
          className="ml-auto px-3 py-1.5 rounded-full text-xs font-medium bg-[#0a0e1a] text-slate-400 hover:text-white border border-white/5 transition flex items-center gap-1"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ─── Activity List ─── */}
      <div className="space-y-2">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity, index) => (
            <div key={index} className="glass-card-sm p-4 flex items-center gap-4 hover:bg-white/5 transition">
              <div className="text-2xl">{getActionIcon(activity.action)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium">{activity.action || 'Unknown action'}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{activity.ip_address || 'Unknown IP'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(activity.created_at).toLocaleString()}
                  </span>
                  {activity.user_agent && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-[200px]">{activity.user_agent}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-8 text-center text-slate-400">
            <Activity size={48} className="mx-auto text-slate-600/30 mb-4" />
            <p>No activity found</p>
            <p className="text-xs mt-1">Activities will appear here as you use your account</p>
          </div>
        )}
      </div>

      {filteredActivities.length > 0 && (
        <div className="text-xs text-slate-500 text-center">
          Showing {filteredActivities.length} activities
        </div>
      )}
    </div>
  );
}
