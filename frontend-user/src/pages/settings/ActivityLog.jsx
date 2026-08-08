// frontend-user/src/pages/settings/ActivityLog.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { ArrowLeft, Activity, Clock, Globe, RefreshCw } from 'lucide-react';

export default function ActivityLog() {
  const navigate = useNavigate();
  const { showInfo } = useNotification();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => (
    localStorage.getItem('vexastore_user_token') ||
    localStorage.getItem('userToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    ''
  );

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
      const res = await fetch(`${vexaAccountUrl}/api/auth/activity-log`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data.data || []);
    } catch (err) {
      console.error('Failed to load activity log');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="min-h-screen bg-dark-bg p-4">
      <div className="max-w-lg mx-auto">
        <Link to="/profile" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-6">
          <ArrowLeft size={20} /> Back
        </Link>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Activity size={20} className="text-cyan-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Activity Log</h1>
            </div>
            <button onClick={fetchLogs} className="text-slate-400 hover:text-white transition">
              <RefreshCw size={18} />
            </button>
          </div>

          {logs.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No recent activity found.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                    <Clock size={14} className="text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{log.action}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <Globe size={12} />
                      <span>IP: {log.ip_address || 'Unknown'}</span>
                      <span>•</span>
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
