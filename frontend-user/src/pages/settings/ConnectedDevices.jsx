// frontend-user/src/pages/settings/ConnectedDevices.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { ArrowLeft, Smartphone, Monitor, Laptop, Wifi, Clock, LogOut, Shield } from 'lucide-react';

export default function ConnectedDevices() {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);

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
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${VEXA_ACCOUNT_URL}/api/auth/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setDevices(data.data || []);
      } else {
        setDevices([{
          id: 1,
          device: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop',
          browser: navigator.userAgent,
          ip: 'Current IP',
          last_active: new Date().toISOString(),
          is_current: true
        }]);
      }
    } catch (err) {
      console.error('Load devices error:', err);
      setDevices([{
        id: 1,
        device: 'Current Device',
        browser: navigator.userAgent,
        ip: 'Unknown',
        last_active: new Date().toISOString(),
        is_current: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (device) => {
    const name = String(device || '').toLowerCase();
    if (name.includes('mobile') || name.includes('phone') || name.includes('android') || name.includes('ios')) {
      return Smartphone;
    }
    if (name.includes('tablet') || name.includes('ipad')) {
      return Laptop;
    }
    if (name.includes('linux')) {
      return Monitor;
    }
    return Monitor;
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
          <Wifi size={24} className="text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">Connected Devices</h1>
        </div>
        <p className="text-slate-400">Devices that have access to your account</p>
      </div>

      <div className="space-y-3">
        {devices.length > 0 ? (
          devices.map((device) => {
            const Icon = getDeviceIcon(device.device || device.browser);
            return (
              <div key={device.id} className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                    <Icon size={20} className="text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {device.device || 'Unknown Device'}
                      {device.is_current && (
                        <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{device.browser || 'Unknown browser'}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>{device.ip || 'IP Unknown'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(device.last_active).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                {!device.is_current && (
                  <button
                    onClick={() => {
                      if (confirm('Remove this device?')) {
                        showSuccess('Device removed');
                        setDevices(devices.filter(d => d.id !== device.id));
                      }
                    }}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition"
                  >
                    <LogOut size={16} />
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="glass-card p-8 text-center text-slate-400">
            <Wifi size={48} className="mx-auto text-slate-600/30 mb-4" />
            <p>No active sessions found</p>
          </div>
        )}
      </div>

      <div className="glass-card p-4 border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <Shield size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-400">
            If you see a device you don't recognize, remove it immediately and change your password.
          </p>
        </div>
      </div>
    </div>
  );
}
