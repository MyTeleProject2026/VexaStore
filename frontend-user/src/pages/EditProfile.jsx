import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { authApi } from '../services/api';
import { User, Mail, ArrowLeft, Save } from 'lucide-react';

export default function EditProfile() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
  });
  const [originalEmail, setOriginalEmail] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('vexastore_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setForm({ name: user.name || '', email: user.email || '' });
        setOriginalEmail(user.email || '');
      } catch (e) {
        console.error('Failed to parse user data');
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showError('Name is required');
      return;
    }
    try {
      setLoading(true);
      // ✅ Call real API
      const res = await authApi.updateProfile({ name: form.name.trim() });
      if (res.data?.success) {
        // Update localStorage
        const userData = localStorage.getItem('vexastore_user');
        if (userData) {
          const user = JSON.parse(userData);
          user.name = res.data.user.name;
          localStorage.setItem('vexastore_user', JSON.stringify(user));
        }
        showSuccess('Profile updated successfully!');
        navigate('/profile');
      }
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Failed to update profile');
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
              className="input-field pl-10"
              value={form.email}
              disabled
              className="input-field pl-10 opacity-60 cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
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
