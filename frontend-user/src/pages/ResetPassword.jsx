// frontend-user/src/pages/ResetPassword.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validToken, setValidToken] = useState(null);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (!token) {
      setValidToken(false);
    } else {
      setValidToken(true);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      showError('Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    try {
      setLoading(true);
      const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
      const response = await fetch(`${vexaAccountUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const data = await response.json();
      if (data.success) {
        showSuccess('Password reset successfully! Please login.');
        navigate('/login');
      } else {
        showError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      showError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (validToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
        <div className="glass-card max-w-md w-full p-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Invalid or Missing Token</h1>
          <p className="text-slate-400">The reset link is invalid or expired. Please request a new one.</p>
          <Link to="/forgot-password" className="text-cyan-400 hover:underline mt-4 inline-block">Request New Link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="glass-card max-w-md w-full p-6">
        <Link to="/login" className="text-slate-400 hover:text-white transition mb-4 inline-block">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold gradient-text text-center mb-2">Reset Password</h1>
        <p className="text-slate-400 text-center text-sm mb-6">Enter your new password below.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">New Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field pl-10 pr-12"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="input-label">Confirm Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field pl-10"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex justify-center">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
