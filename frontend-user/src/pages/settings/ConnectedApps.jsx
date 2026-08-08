// frontend-user/src/pages/settings/ConnectedApps.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { ArrowLeft, Smartphone, Wallet, Globe, Mail, TrendingUp, Layers, Check, X } from 'lucide-react';

export default function ConnectedApps() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => (
    localStorage.getItem('vexastore_user_token') ||
    localStorage.getItem('userToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    ''
  );

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
      const res = await fetch(`${vexaAccountUrl}/api/auth/connected-apps`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setApps(data.data || []);
    } catch (err) {
      console.error('Failed to load connected apps');
    } finally {
      setLoading(false);
    }
  };

  const allApps = [
    { slug: 'vexastore', name: 'VexaStore', icon: Smartphone, description: 'App Store' },
    { slug: 'vexatrade', name: 'VexaTrade', icon: TrendingUp, description: 'Crypto Trading' },
    { slug: 'vexawallet', name: 'VexaWallet', icon: Wallet, description: 'Crypto Wallet' },
    { slug: 'vexamail', name: 'VexaEmail', icon: Mail, description: 'Email Service' },
    { slug: 'vexabrowser', name: 'VexaBrowser', icon: Globe, description: 'Web Browser' },
  ];

  const isConnected = (slug) => apps.some(a => a.app_slug === slug && a.status === 'connected');

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
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Layers size={20} className="text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Connected Apps</h1>
          </div>

          <p className="text-slate-400 text-sm mb-6">
            Apps that use your VexaAccount. One account for all Vexa services.
          </p>

          <div className="space-y-3">
            {allApps.map((app) => {
              const connected = isConnected(app.slug);
              return (
                <div key={app.slug} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                      <app.icon size={20} className="text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{app.name}</p>
                      <p className="text-xs text-slate-400">{app.description}</p>
                    </div>
                  </div>
                  {connected ? (
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check size={12} /> Connected
                    </span>
                  ) : (
                    <span className="text-xs bg-slate-500/20 text-slate-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <X size={12} /> Pending
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-sm text-slate-400">
            💡 <span className="text-white font-medium">Coming soon:</span> Manage connections, revoke access, and see detailed app permissions.
          </div>
        </div>
      </div>
    </div>
  );
}
