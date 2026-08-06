import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { authApi, api } from '../services/api';
import { 
  User, Mail, Phone, Camera, LogOut, 
  Shield, Lock, Globe, Smartphone, 
  ChevronRight, CheckCircle, Edit2, 
  ArrowLeft, Database, 
  Clock, Layers, Key, Eye, EyeOff, Save,
  Download, Trash2, Activity, TrendingUp, Wallet
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useNotification();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [twofaEnabled, setTwofaEnabled] = useState(false);
  const [connectedApps, setConnectedApps] = useState([]);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchConnectedApps();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await authApi.getProfile();
      if (res.data?.success) {
        setUser(res.data.user);
        setTwofaEnabled(res.data.user.twofa_enabled === 1);
        setForm({
          name: res.data.user.name || '',
          phone: res.data.user.phone || '',
          bio: res.data.user.bio || '',
        });
      }
    } catch (err) {
      console.error('Profile fetch error:', err.response?.data || err.message);
      showError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectedApps = async () => {
    try {
      const res = await authApi.getConnectedApps();
      if (res.data?.success) {
        setConnectedApps(res.data.data || []);
      }
    } catch (err) {
      console.error('Connected apps fetch error:', err);
    }
  };

  const handleConnectApp = async (appName, appSlug) => {
    try {
      setConnecting(true);
      await authApi.connectApp({ app_name: appName, app_slug: appSlug });
      showSuccess(`${appName} connected successfully!`);
      await fetchConnectedApps();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to connect app');
    } finally {
      setConnecting(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const res = await authApi.updateProfileFull({
        name: form.name,
        phone: form.phone,
        bio: form.bio,
      });
      if (res.data?.success) {
        setUser(res.data.user);
        setEditMode(false);
        const stored = localStorage.getItem('vexastore_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.name = res.data.user.name;
          localStorage.setItem('vexastore_user', JSON.stringify(parsed));
        }
        showSuccess('Profile updated');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      setUploading(true);
      const res = await api.post('/api/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        const avatar_url = res.data.avatar_url;
        await authApi.updateProfilePicture(avatar_url);
        showSuccess('Avatar updated');
        fetchProfile();
      }
    } catch (err) {
      showError('Avatar upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      const res = await authApi.enable2FA();
      if (res.data?.success) {
        setTwofaEnabled(true);
        const codes = res.data.backup_codes?.join(', ') || '';
        showSuccess(`2FA Enabled! Backup codes: ${codes}`);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to enable 2FA');
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Disable 2FA? This will reduce account security.')) return;
    try {
      await authApi.disable2FA();
      setTwofaEnabled(false);
      showSuccess('2FA disabled');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to disable 2FA');
    }
  };

  const handleExportData = async () => {
    try {
      const res = await authApi.exportData();
      if (res.data?.success) {
        const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vexastore-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showSuccess('Data exported successfully');
      }
    } catch (err) {
      showError('Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmText === 'DELETE') {
      try {
        await authApi.deleteAccount({ confirm: confirmText });
        showSuccess('Account deleted successfully');
        localStorage.removeItem('vexastore_user_token');
        localStorage.removeItem('vexastore_user');
        navigate('/');
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to delete account');
      }
    } else if (confirmText !== null) {
      showError('Confirmation failed. Type "DELETE" exactly.');
    }
  };

  const handleViewActivity = async () => {
    try {
      const res = await authApi.getActivityLog();
      const logs = res.data?.data || [];
      if (logs.length === 0) {
        showInfo('No recent activity found');
      } else {
        showInfo(`Last ${logs.length} activities logged`);
      }
    } catch (err) {
      showError('Failed to load activity log');
    }
  };

  const handleViewSessions = async () => {
    try {
      const res = await authApi.getSessions();
      const sessions = res.data?.data || [];
      showInfo(`Found ${sessions.length} active session(s)`);
    } catch (err) {
      showError('Failed to load sessions');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vexastore_user_token');
    localStorage.removeItem('vexastore_user');
    showSuccess('Logged out');
    navigate('/');
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'privacy', label: 'Privacy & Data', icon: Database },
    { id: 'apps', label: 'Connected Apps', icon: Layers },
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div></div>;
  }

  if (!user) {
    return (
      <div className="glass-card p-8 text-center text-slate-400">
        <User size={48} className="mx-auto text-slate-600/30 mb-4" />
        <p className="text-lg font-medium text-slate-400">Not logged in</p>
        <Link to="/login" className="text-cyan-400 hover:underline mt-2 inline-block">Sign In</Link>
      </div>
    );
  }

  // Check if an app is connected
  const isAppConnected = (slug) => {
    return connectedApps.some(app => app.app_slug === slug && app.status === 'connected');
  };

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition">
        <ArrowLeft size={20} /> Back
      </Link>

      {/* Profile Header */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 flex items-center justify-center border-2 border-cyan-500/20 overflow-hidden">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-cyan-400">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-cyan-500 rounded-full p-1.5 cursor-pointer hover:bg-cyan-400 transition disabled:opacity-50">
            {uploading ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin inline-block"></span>
            ) : (
              <Camera size={16} className="text-black" />
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
          </label>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-bold text-white">{user.name}</h1>
          <p className="text-slate-400">{user.email}</p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
              {user.is_verified ? 'Verified' : 'Unverified'}
            </span>
            {user.phone && <span className="text-xs text-slate-500">{user.phone}</span>}
            {twofaEnabled && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                🔐 2FA
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setEditMode(!editMode)}
          className="btn-secondary flex items-center gap-2"
        >
          <Edit2 size={16} /> {editMode ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: Personal Info */}
      {/* ============================================================ */}
      {activeTab === 'personal' && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Personal Information</h2>
          {editMode ? (
            <div className="space-y-4">
              <div>
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label">Email</label>
                <input
                  type="email"
                  className="input-field opacity-60 cursor-not-allowed"
                  value={user.email}
                  disabled
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="input-label">Phone</label>
                <input
                  type="tel"
                  className="input-field"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 234 567 890"
                />
              </div>
              <div>
                <label className="input-label">Bio</label>
                <textarea
                  className="input-field min-h-[80px] resize-y"
                  value={form.bio}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell us about yourself"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? <span className="w-4 h-4 border-2 border-black/30 border-t-transparent rounded-full animate-spin"></span> : <Save size={18} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-slate-400">Name</span>
                <span className="text-white">{user.name}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-slate-400">Email</span>
                <span className="text-white">{user.email}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-slate-400">Phone</span>
                <span className="text-white">{user.phone || 'Not set'}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-slate-400">Bio</span>
                <span className="text-white">{user.bio || 'No bio yet'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Member since</span>
                <span className="text-white">{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: Security */}
      {/* ============================================================ */}
      {activeTab === 'security' && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Security</h2>
          
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <p className="text-white font-medium">Password</p>
              <p className="text-sm text-slate-400">Last changed: —</p>
            </div>
            <Link to="/change-password" className="text-cyan-400 hover:underline text-sm flex items-center gap-1">
              Change <ChevronRight size={16} />
            </Link>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <p className="text-white font-medium">Two‑Factor Authentication</p>
              <p className={`text-sm ${twofaEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
                {twofaEnabled ? '✅ Enabled' : 'Add extra security'}
              </p>
            </div>
            {twofaEnabled ? (
              <button onClick={handleDisable2FA} className="text-red-400 hover:underline text-sm">Disable</button>
            ) : (
              <button onClick={handleEnable2FA} className="text-cyan-400 hover:underline text-sm">Set up</button>
            )}
          </div>

          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <p className="text-white font-medium">Email Verification</p>
              <p className={`text-sm ${user.is_verified ? 'text-emerald-400' : 'text-amber-400'}`}>
                {user.is_verified ? '✅ Verified' : '❌ Not verified'}
              </p>
            </div>
            {!user.is_verified && (
              <button
                onClick={async () => {
                  try {
                    await authApi.resendVerification();
                    showSuccess('Verification email resent');
                  } catch (err) {
                    showError(err.response?.data?.message || 'Failed to resend');
                  }
                }}
                className="text-cyan-400 hover:underline text-sm"
              >
                Resend
              </button>
            )}
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-white font-medium">Connected Devices</p>
              <p className="text-sm text-slate-400">Manage sessions</p>
            </div>
            <button onClick={handleViewSessions} className="text-cyan-400 hover:underline text-sm">View</button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: Privacy & Data */}
      {/* ============================================================ */}
      {activeTab === 'privacy' && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Privacy & Data</h2>

          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <p className="text-white font-medium">Data Export</p>
              <p className="text-sm text-slate-400">Download your account data as JSON</p>
            </div>
            <button onClick={handleExportData} className="text-cyan-400 hover:underline text-sm flex items-center gap-1">
              <Download size={14} /> Export
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <p className="text-white font-medium">Delete Account</p>
              <p className="text-sm text-red-400">Permanently delete your data</p>
            </div>
            <button onClick={handleDeleteAccount} className="text-red-400 hover:underline text-sm flex items-center gap-1">
              <Trash2 size={14} /> Delete
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-white font-medium">Activity Log</p>
              <p className="text-sm text-slate-400">Review your recent activity</p>
            </div>
            <button onClick={handleViewActivity} className="text-cyan-400 hover:underline text-sm flex items-center gap-1">
              <Activity size={14} /> View
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: Connected Apps - FULLY FUNCTIONAL */}
      {/* ============================================================ */}
      {activeTab === 'apps' && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Connected Apps</h2>
          <p className="text-sm text-slate-400">
            Apps and services that use your VexaAccount. One account for all Vexa apps.
          </p>
          
          <div className="space-y-3">
            {/* VexaStore - Always connected */}
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Smartphone size={20} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium">VexaStore</p>
                  <p className="text-xs text-slate-400">This app • Active</p>
                </div>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">Connected</span>
            </div>

            {/* VexaTrade */}
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <TrendingUp size={20} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium">VexaTrade</p>
                  <p className="text-xs text-slate-400">
                    Crypto Trading Platform • {isAppConnected('vexatrade') ? 'Connected' : 'Connect to use'}
                  </p>
                </div>
              </div>
              {isAppConnected('vexatrade') ? (
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">Connected</span>
              ) : (
                <button
                  onClick={() => handleConnectApp('VexaTrade', 'vexatrade')}
                  disabled={connecting}
                  className="text-cyan-400 hover:underline text-sm disabled:opacity-50"
                >
                  {connecting ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>

            {/* VexaWallet */}
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Wallet size={20} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium">VexaWallet</p>
                  <p className="text-xs text-slate-400">Coming soon</p>
                </div>
              </div>
              <span className="text-xs bg-slate-500/20 text-slate-300 px-2 py-0.5 rounded-full">Pending</span>
            </div>

            {/* VexaEmail */}
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Mail size={20} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium">VexaEmail</p>
                  <p className="text-xs text-slate-400">Coming soon</p>
                </div>
              </div>
              <span className="text-xs bg-slate-500/20 text-slate-300 px-2 py-0.5 rounded-full">Pending</span>
            </div>

            {/* VexaBrowser */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Globe size={20} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium">VexaBrowser</p>
                  <p className="text-xs text-slate-400">Coming soon</p>
                </div>
              </div>
              <span className="text-xs bg-slate-500/20 text-slate-300 px-2 py-0.5 rounded-full">Pending</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-4 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
            <p className="text-sm text-slate-400">
              💡 <span className="text-white font-medium">One Account, All Vexa Apps</span>
              <br />
              Your VexaAccount works across VexaStore, VexaTrade, VexaWallet, VexaEmail, and VexaBrowser.
              No need to create separate accounts!
            </p>
          </div>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="btn-danger w-full flex items-center justify-center gap-2 py-3"
      >
        <LogOut size={18} /> Logout
      </button>
    </div>
  );
}
