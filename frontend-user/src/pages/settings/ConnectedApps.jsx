// frontend-user/src/pages/settings/ConnectedApps.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { ArrowLeft, Layers, Smartphone, TrendingUp, Wallet, Mail, Globe, Shield, Check, X } from 'lucide-react';

export default function ConnectedApps() {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState([]);

  const getToken = () => {
    return (
      localStorage.getItem('vexastore_user_token') ||
      localStorage.getItem('userToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      ''
    );
  };

  const VEXA_ACCOUNT_URL = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${VEXA_ACCOUNT_URL}/api/auth/connected-apps`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setApps(data.data || []);
      } else {
        setApps([
          { app_name: 'VexaStore', app_slug: 'vexastore', status: 'connected', connected_at: new Date().toISOString() },
        ]);
      }
    } catch (err) {
      console.error('Load connected apps error:', err);
      setApps([
        { app_name: 'VexaStore', app_slug: 'vexastore', status: 'connected', connected_at: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getAppIcon = (appName) => {
    const name = String(appName || '').toLowerCase();
    if (name.includes('store')) return Smartphone;
    if (name.includes('trade')) return TrendingUp;
    if (name.includes('wallet')) return Wallet;
    if (name.includes('email')) return Mail;
    if (name.includes('browser')) return Globe;
    return Layers;
  };

  const disconnectApp = async (appSlug, appName) => {
    if (!confirm(`Disconnect ${appName} from your account?`)) return;

    try {
      const token = getToken();
      if (!token) {
        showError('Please login first');
        return;
      }

      const response = await fetch(`${VEXA_ACCOUNT_URL}/api/auth/disconnect-app`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ app_slug: appSlug })
      });

      const data = await response.json();
      if (data.success) {
        showSuccess(`${appName} disconnected successfully`);
        setApps(apps.map(app =>
          app.app_slug === appSlug ? { ...app, status: 'disconnected' } : app
        ));
      } else {
        showError(data.message || 'Failed to disconnect app');
      }
    } catch (err) {
      showError('Failed to disconnect app');
    }
  };

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
          <Layers size={24} className="text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">Connected Apps</h1>
        </div>
        <p className="text-slate-400">Apps and services connected to your VexaAccount</p>
      </div>

      <div className="space-y-3">
        {apps.length > 0 ? (
          apps.map((app) => {
            const Icon = getAppIcon(app.app_name);
            const isConnected = app.status === 'connected';
            return (
              <div key={app.app_slug} className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                    <Icon size={20} className="text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{app.app_name}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={isConnected ? 'text-emerald-400' : 'text-amber-400'}>
                        {isConnected ? 'Connected' : 'Pending'}
                      </span>
                      {app.connected_at && (
                        <>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-500">
                            Connected {new Date(app.connected_at).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {isConnected ? (
                  <button
                    onClick={() => disconnectApp(app.app_slug, app.app_name)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition"
                  >
                    <X size={16} />
                  </button>
                ) : (
                  <span className="text-xs bg-slate-500/20 text-slate-300 px-3 py-1 rounded-full">
                    Pending
                  </span>
                )}
              </div>
            );
          })
        ) : (
          <div className="glass-card p-8 text-center text-slate-400">
            <Layers size={48} className="mx-auto text-slate-600/30 mb-4" />
            <p>No connected apps found</p>
          </div>
        )}
      </div>

      <div className="glass-card p-4 border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-start gap-3">
          <Shield size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-slate-400">
              Your VexaAccount works across all Vexa apps. Manage which apps have access to your account.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              💡 Disconnecting an app will revoke its access to your account data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
