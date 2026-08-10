// frontend-user/src/pages/EditProfile.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { ArrowLeft, User, Mail, Phone, Camera, Save, X } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';

export default function EditProfile() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', bio: '' });

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
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        const stored = getUserFromStorage();
        if (stored) {
          setUser(stored);
          setForm({
            name: stored.name || '',
            phone: stored.phone || '',
            bio: stored.bio || '',
          });
        }
        setLoading(false);
        return;
      }

      const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
      const response = await fetch(`${vexaAccountUrl}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setForm({
          name: data.user.name || '',
          phone: data.user.phone || '',
          bio: data.user.bio || '',
        });
      } else {
        const stored = getUserFromStorage();
        if (stored) {
          setUser(stored);
          setForm({
            name: stored.name || '',
            phone: stored.phone || '',
            bio: stored.bio || '',
          });
        }
      }
    } catch (err) {
      console.error('Load profile error:', err);
      const stored = getUserFromStorage();
      if (stored) {
        setUser(stored);
        setForm({
          name: stored.name || '',
          phone: stored.phone || '',
          bio: stored.bio || '',
        });
      }
    } finally {
      setLoading(false);
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

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
        const response = await fetch(`${vexaAccountUrl}/api/auth/profile/picture`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ avatar_url: base64String })
        });

        const data = await response.json();
        if (data.success) {
          showSuccess('Avatar updated');
          loadProfile();
        } else {
          showError(data.message || 'Avatar update failed');
        }
      };
      reader.readAsDataURL(file);

    } catch (err) {
      showError('Avatar upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showError('Name is required');
      return;
    }

    try {
      setSaving(true);
      const token = getToken();
      if (!token) {
        showError('Please login first');
        return;
      }

      const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
      const response = await fetch(`${vexaAccountUrl}/api/auth/profile/full`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone || '',
          bio: form.bio || '',
        })
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('Profile updated successfully!');
        localStorage.setItem('vexastore_user', JSON.stringify(data.user));
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userData', JSON.stringify(data.user));
        navigate('/profile');
      } else {
        showError(data.message || 'Update failed');
      }
    } catch (err) {
      showError(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="spinner" />
        <p className="mt-4 text-slate-500 text-sm">Loading...</p>
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
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link to="/profile" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition">
        <ArrowLeft size={20} /> Back to Profile
      </Link>

      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold gradient-text text-center mb-2">Edit Profile</h1>
        <p className="text-slate-400 text-center text-sm mb-6">Update your personal information</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ─── Avatar ─── */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <UserAvatar user={user} size="xl" />
              <label className="absolute bottom-0 right-0 bg-cyan-500 rounded-full p-1.5 cursor-pointer hover:bg-cyan-400 transition disabled:opacity-50">
                {uploading ? (
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin inline-block"></span>
                ) : (
                  <Camera size={16} className="text-black" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-2">Click the camera icon to change your avatar</p>
          </div>

          {/* ─── Name ─── */}
          <div>
            <label className="input-label">Full Name *</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                className="input-field pl-10"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

          {/* ─── Email (read-only) ─── */}
          <div>
            <label className="input-label">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                className="input-field pl-10 opacity-60 cursor-not-allowed"
                value={user.email}
                disabled
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
          </div>

          {/* ─── Phone ─── */}
          <div>
            <label className="input-label">Phone</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="tel"
                className="input-field pl-10"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          {/* ─── Bio ─── */}
          <div>
            <label className="input-label">Bio</label>
            <textarea
              className="input-field min-h-[100px] resize-y"
              value={form.bio}
              onChange={e => set
