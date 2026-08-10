// frontend-user/src/pages/settings/ChangePassword.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { ArrowLeft, Lock, Eye, EyeOff, Key } from 'lucide-react';

export default function ChangePassword() {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const getToken = () => {
    return (
      localStorage.getItem('vexastore_user_token') ||
      localStorage.getItem('userToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      ''
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      showError('Please fill in all fields');
      return;
    }

    if (form.newPassword.length < 6) {
      showError('New password must be at least 6 characters');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        showError('Please login first');
        return;
      }

      const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
      const response = await fetch(`${vexaAccountUrl}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        })
      });

      const data = await response.json();
      if (data.success) {
        showSuccess('Password changed successfully');
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showError(data.message || 'Failed to change password');
      }
    } catch (err) {
      showError('Failed to change password');
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
        <div className="flex items-center gap-3 mb-2">
          <Key size={24} className="text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">Change Password</h1>
        </div>
        <p className="text-slate-400">Update your account password</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
        <div>
          <label className="input-label">Current Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type={showCurrent ? 'text' : 'password'}
              className="input-field pl-10 pr-12"
              value={form.currentPassword}
              onChange={e => setForm({ ...form, currentPassword: e.target.value })}
              placeholder="Enter current password"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              onClick={() => setShowCurrent(!showCurrent)}
            >
              {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="input-label">New Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type={showNew ? 'text' : 'password'}
              className="input-field pl-10 pr-12"
              value={form.newPassword}
              onChange={e => setForm({ ...form, newPassword: e.target.value })}
              placeholder="Enter new password (min 6 chars)"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              onClick={() => setShowNew(!showNew)}
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">Password must be at least 6 characters</p>
        </div>

        <div>
          <label className="input-label">Confirm New Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type={showConfirm ? 'text' : 'password'}
              className="input-field pl-10 pr-12"
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          {loading ? <span className="spinner-small" /> : <Key size={18} />}
          {loading ? 'Changing...' : 'Change Password'}
        </button>

        <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
          <p className="text-xs text-slate-400">
            💡 For security, we recommend using a strong, unique password that you don't use elsewhere.
          </p>
        </div>
      </form>
    </div>
  );
}
