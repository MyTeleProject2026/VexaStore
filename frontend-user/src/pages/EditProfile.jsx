// frontend-user/src/pages/EditProfile.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { ArrowLeft, Save, User, Mail, Phone, Camera, X } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';

export default function EditProfile() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    bio: '',
    avatar: null,
    avatarPreview: null,
  });

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
        const storedUser = getUserFromStorage();
        if (storedUser) {
          setUser(storedUser);
          setForm({
            name: storedUser.name || '',
            phone: storedUser.phone || '',
            bio: storedUser.bio || '',
            avatar: null,
            avatarPreview: storedUser.avatar_url || null,
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
        const userData = data.user;
        setUser(userData);
        setForm({
          name: userData.name || '',
          phone: userData.phone || '',
          bio: userData.bio || '',
          avatar: null,
          avatarPreview: userData.avatar_url || null,
        });
      } else {
        const storedUser = getUserFromStorage();
        if (storedUser) {
          setUser(storedUser);
          setForm({
            name: storedUser.name || '',
            phone: storedUser.phone || '',
            bio: storedUser.bio || '',
            avatar: null,
            avatarPreview: storedUser.avatar_url || null,
          });
        }
      }
    } catch (err) {
      console.error('Load profile error:', err);
      const storedUser = getUserFromStorage();
      if (storedUser) {
        setUser(storedUser);
        setForm({
          name: storedUser.name || '',
          phone: storedUser.phone || '',
          bio: storedUser.bio || '',
          avatar: null,
          avatarPreview: storedUser.avatar_url || null,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setForm({
          ...form,
          avatar: file,
          avatarPreview: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setForm({
      ...form,
      avatar: null,
      avatarPreview: null,
    });
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

      // First, upload avatar if changed
      let avatarUrl = form.avatarPreview;
      if (form.avatar) {
        const reader = new FileReader();
        const avatarData = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(form.avatar);
        });

        const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
        const avatarResponse = await fetch(`${vexaAccountUrl}/api/auth/profile/picture`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ avatar_url: avatarData })
        });

        const avatarDataJson = await avatarResponse.json();
        if (avatarDataJson.success) {
          avatarUrl = avatarDataJson.avatar_url;
        }
      }

      // Then update profile
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
        const updatedUser = { ...data.user, avatar_url: avatarUrl };
        localStorage.setItem('vexastore_user', JSON.stringify(updatedUser));
        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('userData', JSON.stringify(updatedUser));

        showSuccess('Profile updated successfully!');
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
      <Link to="/profile" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition">
        <ArrowLeft size={20} /> Back to Profile
      </Link>

      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
        <p className="text-slate-400">Update your personal information</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        {/* ─── Avatar ─── */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            {form.avatarPreview ? (
              <div className="relative">
                <img
                  src={form.avatarPreview}
                  alt="Avatar preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-cyan-500/20"
                />
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <UserAvatar user={user} size="xl" />
            )}
            <label className="absolute bottom-0 right-0 bg-cyan-500 rounded-full p-1.5 cursor-pointer hover:bg-cyan-400 transition disabled:opacity-50">
              {uploading ? (
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin inline-block"></span>
              ) : (
                <Camera size={16} className="text-black" />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploading} />
            </label>
          </div>
          <p className="text-xs text-slate-500">Click the camera icon to change your avatar</p>
        </div>

        {/* ─── Form Fields ─── */}
        <div>
          <label className="input-label">Full Name *</label>
          <input
            type="text"
            className="input-field"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Your full name"
            required
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
          <p className="text-xs text-slate-500 mt-1">Email cannot be changed. Contact support for assistance.</p>
        </div>

        <div>
          <label className="input-label">Phone Number</label>
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
            className="input-field min-h-[100px] resize-y"
            value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell us a bit about yourself..."
          />
          <p className="text-xs text-slate-500 mt-1">{form.bio.length} characters</p>
        </div>

        <div className="flex gap-3 pt-4 border-t border-white/5">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
          >
            {saving ? <span className="spinner-small" /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link to="/profile" className="btn-secondary flex-1 flex items-center justify-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
