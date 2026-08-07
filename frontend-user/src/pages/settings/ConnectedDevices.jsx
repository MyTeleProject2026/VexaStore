// frontend-user/src/pages/settings/ConnectedDevices.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { ArrowLeft, Monitor, Smartphone, Clock, Globe, RefreshCw } from 'lucide-react';

export default function ConnectedDevices() {
  const navigate = useNavigate();
  const { showInfo } = useNotification();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => (
    localStorage.getItem('vexastore_user_token') ||
    localStorage.getItem('userToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    ''
  );

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
      const res = await fetch(`${vexaAccountUrl}/api/auth/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSessions(data.data || []);
    } catch (err) {
      console.error('Failed to load sessions');
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
                <Monitor size={20} className="text-cyan-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Connected Devices</h1>
            </div>
            <button onClick={fetchSessions} className="text-slate-400 hover:text-white transition">
              <RefreshCw size={18} />
            </button>
          </div>

          {sessions.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No active sessions found.</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                      {session.is_current ? <Smartphone size={20} className="text-emerald-400" /> : <Monitor size={20} className="text-slate-400" />}
                    </div>
                    <div>
                      <p className="text-white font-medium">{session.browser || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">IP: {session.ip || 'Unknown'} • {session.is_current ? 'Current' : 'Active'}</p>
                      <p className="text-xs text-slate-500">Last active: {new Date(session.last_active).toLocaleString()}</p>
                    </div>
                  </div>
                  {session.is_current && (
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">This device</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
