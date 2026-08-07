// frontend-user/src/pages/EditProfile.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { User, Mail, ArrowLeft, Save } from 'lucide-react';

export default function EditProfile() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', bio: '' });

  // ✅ Helper: Get token
  const getToken = () => (
    localStorage.getItem('vexastore_user_token') ||
    localStorage.getItem('userToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    ''
  );

  useEffect(() => {
    const userData = 
      localStorage.getItem('vexastore_user') ||
      localStorage.getItem('user') ||
      localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setForm({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          bio: user.bio || '',
        });
      } catch (e) {}
    }
    // Optionally fetch fresh profile from VexaAccount
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
      const res = await fetch(`${vexaAccountUrl}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const user = data.user;
        setForm({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          bio: user.bio || '',
        });
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showError('Name is required');
      return;
    }
    const token = getToken();
    if (!token) {
      showError('Please login first');
      return;
    }
    try {
      setLoading(true);
      const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
      const res = await fetch(`${vexaAccountUrl}/api/auth/profile/full`, {
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
      const data = await res.json();
      if (data.success) {
        // Update localStorage with new data
        const stored = localStorage.getItem('vexastore_user');
        if (stored) {
          const user = JSON.parse(stored);
          const updated = { ...user, ...data.user };
          localStorage.setItem('vexastore_user', JSON.stringify(updated));
          localStorage.setItem('user', JSON.stringify(updated));
          localStorage.setItem('userData', JSON.stringify(updated));
        }
        showSuccess('Profile updated successfully!');
        navigate('/profile');
      } else {
        showError(data.message || 'Update failed');
      }
    } catch (err) {
      showError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/profile" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition">
        <ArrowLeft size={20} /> Back to Profile
      </Link>

      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
        <p className="text-slate-400 text-sm mt-1">Update your account information</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
        <div>
          <label className="input-label">Full Name</label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              className="input-field pl-10"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
        </div>
        <div>
          <label className="input-label">Email</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="email"
              className="input-field pl-10 opacity-60 cursor-not-allowed"
              value={form.email}
              disabled
            />
          </div>
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
            className="input-field min-h-[100px] resize-y"
            value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell us about yourself"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 flex justify-center items-center gap-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-black/30 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <Save size={18} />
          )}
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
