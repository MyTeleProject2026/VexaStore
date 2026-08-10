// frontend-user/src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import {
  User, Mail, Phone, Camera, LogOut,
  Shield, Lock, Globe, Smartphone,
  ChevronRight, CheckCircle, Edit2,
  ArrowLeft, Database,
  Clock, Layers, Key, Save,
  Download, Trash2, Activity, TrendingUp, Wallet,
  Settings, Heart, Award
} from 'lucide-react';
import UserAvatar from '../components/UserAvatar';

export default function Profile() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [twofaEnabled, setTwofaEnabled] = useState(false);
  const [stats, setStats] = useState({
    downloads: 0,
    favorites: 0,
    reviews: 0,
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api-vexastore.onrender.com';
  const VEXA_ACCOUNT_URL = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';

  const getUserFromStorage = () => {
    try {
      const data =
        localStorage.getItem('vexastore_user') ||
        localStorage.getItem('user') ||
        localStorage.getItem('userData');
      if (data) return JSON.parse(data);
      return null;
    } catch {
      return null;
    }
  };

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
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const token = getToken();
      if (!token) {
        const storedUser = getUserFromStorage();
        if (storedUser) {
          setUser(storedUser);
          setTwofaEnabled(storedUser.twofa_enabled === 1);
          setForm({
            name: storedUser.name || '',
            phone: storedUser.phone || '',
            bio: storedUser.bio || '',
          });
        }
        setLoading(false);
        return;
      }

      const response = await fetch(`${VEXA_ACCOUNT_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        const userData = data.user;
        setUser(userData);
        setTwofaEnabled(userData.twofa_enabled === 1);
        setForm({
          name: userData.name || '',
          phone: userData.phone || '',
          bio: userData.bio || '',
        });

        // Try to get stats from VexaStore
        try {
          const statsRes = await fetch(`${API_BASE_URL}/api/user/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const statsData = await statsRes.json();
          if (statsData.success) {
            setStats(statsData.data);
          }
        } catch {
          // Stats are optional
        }
      } else {
        const storedUser = getUserFromStorage();
        if (storedUser) {
          setUser(storedUser);
          setTwofaEnabled(storedUser.twofa_enabled === 1);
          setForm({
            name: storedUser.name || '',
            phone: storedUser.phone || '',
            bio: storedUser.bio || '',
          });
        }
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      const storedUser = getUserFromStorage();
      if (storedUser) {
        setUser(storedUser);
        setTwofaEnabled(storedUser.twofa_enabled === 1);
        setForm({
          name: storedUser.name || '',
          phone: storedUser.phone || '',
          bio: storedUser.bio || '',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      const token = getToken();
      if (!token) {
        showError('Please login first');
        return;
      }

      const response = await fetch(`${VEXA_ACCOUNT_URL}/api/auth/profile/full`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          bio: form.bio,
        })
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setEditMode(false);

        const stored = getUserFromStorage();
        if (stored) {
          const updated = { ...stored, ...data.user };
          localStorage.setItem('vexastore_user', JSON.stringify(updated));
          localStorage.setItem('user', JSON.stringify(updated));
          localStorage.setItem('userData', JSON.stringify(updated));
        }

        showSuccess('Profile updated');
      } else {
        showError(data.message || 'Update failed');
      }
    } catch (err) {
      showError(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);

      const token = getToken();
      if (!token) {
        showError('Please login first');
        return;
      }

      // ✅ Upload to VexaStore backend (Cloudinary)
      const formData = new FormData();
      formData.append('avatar', file);

      const uploadResponse = await fetch(`${API_BASE_URL}/api/upload/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadData.success) {
        showError(uploadData.message || 'Avatar upload failed');
        return;
      }

      const avatarUrl = uploadData.avatar_url;

      // ✅ Update profile with Cloudinary URL
      const response = await fetch(`${VEXA_ACCOUNT_URL}/api/auth/profile/picture`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ avatar_url: avatarUrl })
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('Avatar updated successfully');
        fetchProfile();
      } else {
        showError(data.message || 'Avatar update failed');
      }
    } catch (err) {
      showError('Avatar upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const token = getToken();
      if (!token) {
        showError('Please login first');
        return;
      }

      const response = await fetch(`${VEXA_ACCOUNT_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        showSuccess('Verification email resent');
      } else {
        showError(data.message || 'Failed to resend');
      }
    } catch (err) {
      showError('Failed to resend verification');
    }
  };

  const handleLogout = () => {
    const keys = [
      'vexastore_user_token', 'vexastore_user',
      'userToken', 'token', 'accessToken',
      'user', 'userData'
    ];
    keys.forEach(key => localStorage.removeItem(key));
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
    return (
      <div className="flex justify-center py-20">
        <div className="spinner" />
      </div>
    );
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

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition">
        <ArrowLeft size={20} /> Back
      </Link>

      {/* ─── Profile Header ─── */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="relative group">
          <UserAvatar user={user} size="xl" />
          <label className="absolute bottom-0 right-0 bg-cyan-500 rounded-full p-1.5 cursor-pointer hover:bg-cyan-400 transition disabled:opacity-50">
            {uploading ? (
              <span className="spinner-small" />
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
            <span className={`text-xs px-2 py-0.5 rounded-full ${user.is_verified ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
              {user.is_verified ? '✅ Verified' : '❌ Unverified'}
            </span>
            {user.phone && <span className="text-xs text-slate-500">{user.phone}</span>}
            {twofaEnabled && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">🔐 2FA</span>
            )}
            <span className="text-xs text-slate-500">Member since {new Date(user.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <button
          onClick={() => setEditMode(!editMode)}
          className="btn-secondary flex items-center gap-2"
        >
          <Edit2 size={16} /> {editMode ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card-sm p-3 text-center">
          <Download size={18} className="mx-auto text-cyan-400 mb-1" />
          <p className="text-lg font-bold text-white">{stats.downloads || 0}</p>
          <p className="text-[10px] text-slate-500">Downloads</p>
        </div>
        <div className="glass-card-sm p-3 text-center">
          <Heart size={18} className="mx-auto text-rose-400 mb-1" />
          <p className="text-lg font-bold text-white">{stats.favorites || 0}</p>
          <p className="text-[10px] text-slate-500">Favorites</p>
        </div>
        <div className="glass-card-sm p-3 text-center">
          <Award size={18} className="mx-auto text-amber-400 mb-1" />
          <p className="text-lg font-bold text-white">{stats.reviews || 0}</p>
          <p className="text-[10px] text-slate-500">Reviews</p>
        </div>
      </div>

      {/* ─── Tabs ─── */}
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

      {/* ─── TAB 1: Personal Info ─── */}
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
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {saving ? <span className="spinner-small" /> : <Save size={18} />}
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

      {/* ─── TAB 2: Security ─── */}
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
              <p className="text-white font-medium">Two-Factor Authentication</p>
              <p className={`text-sm ${twofaEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
                {twofaEnabled ? '✅ Enabled' : 'Add extra security'}
              </p>
            </div>
            <Link to="/settings/2fa" className="text-cyan-400 hover:underline text-sm">
              {twofaEnabled ? 'Manage 2FA' : 'Set up 2FA'}
            </Link>
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
                onClick={handleResendVerification}
                className="text-cyan-400 hover:underline text-sm"
              >
                Resend Verification
              </button>
            )}
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-white font-medium">Connected Devices</p>
              <p className="text-sm text-slate-400">Manage sessions</p>
            </div>
            <Link to="/settings/devices" className="text-cyan-400 hover:underline text-sm">
              View Devices
            </Link>
          </div>
        </div>
      )}

      {/* ─── TAB 3: Privacy & Data ─── */}
      {activeTab === 'privacy' && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Privacy & Data</h2>

          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <p className="text-white font-medium">Data Export</p>
              <p className="text-sm text-slate-400">Download your account data as JSON</p>
            </div>
            <Link to="/settings/export" className="text-cyan-400 hover:underline text-sm flex items-center gap-1">
              <Download size={14} /> Export Data
            </Link>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <p className="text-white font-medium">Delete Account</p>
              <p className="text-sm text-red-400">Permanently delete your data</p>
            </div>
            <Link to="/settings/delete" className="text-red-400 hover:underline text-sm flex items-center gap-1">
              <Trash2 size={14} /> Delete Account
            </Link>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-white font-medium">Activity Log</p>
              <p className="text-sm text-slate-400">Review your recent activity</p>
            </div>
            <Link to="/settings/activity" className="text-cyan-400 hover:underline text-sm flex items-center gap-1">
              <Activity size={14} /> View Activity
            </Link>
          </div>
        </div>
      )}

      {/* ─── TAB 4: Connected Apps ─── */}
      {activeTab === 'apps' && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Connected Apps</h2>
          <p className="text-sm text-slate-400">
            Apps and services that use your VexaAccount.
          </p>

          <div className="space-y-3">
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
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <TrendingUp size={20} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium">VexaTrade</p>
                  <p className="text-xs text-slate-400">Crypto Trading Platform</p>
                </div>
              </div>
              <span className="text-xs bg-slate-500/20 text-slate-300 px-2 py-0.5 rounded-full">Pending</span>
            </div>
          </div>

          <div className="mt-4">
            <Link to="/settings/apps" className="text-cyan-400 hover:underline text-sm flex items-center gap-1">
              <Layers size={14} /> Manage Connected Apps →
            </Link>
          </div>

          <div className="mt-2 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
            <p className="text-sm text-slate-400">
              💡 <span className="text-white font-medium">One Account, All Vexa Apps</span>
              <br />
              Your VexaAccount works across VexaStore, VexaTrade, VexaWallet, and more.
            </p>
          </div>
        </div>
      )}

      {/* ─── Logout ─── */}
      <button
        onClick={handleLogout}
        className="btn-danger w-full flex items-center justify-center gap-2 py-3"
      >
        <LogOut size={18} /> Logout
      </button>
    </div>
  );
}
