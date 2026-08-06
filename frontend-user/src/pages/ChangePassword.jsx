import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { authApi } from '../services/api';
import { Lock, Eye, EyeOff, ArrowLeft, Save } from 'lucide-react';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      showError('Please fill all fields');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    if (form.newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      // ✅ Call real API
      const res = await authApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      if (res.data?.success) {
        showSuccess('Password changed successfully!');
        navigate('/profile');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to change password';
      showError(msg);
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
        <h1 className="text-2xl font-bold text-white">Change Password</h1>
        <p className="text-slate-400 text-sm mt-1">Update your password</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
        <div>
          <label className="input-label">Current Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field pl-10 pr-12"
              value={form.currentPassword}
              onChange={e => setForm({ ...form, currentPassword: e.target.value })}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div>
          <label className="input-label">New Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field pl-10 pr-12"
              value={form.newPassword}
              onChange={e => setForm({ ...form, newPassword: e.target.value })}
              required
            />
          </div>
        </div>
        <div>
          <label className="input-label">Confirm New Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field pl-10"
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
          </div>
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
          {loading ? 'Updating...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
