import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { authApi } from '../services/api';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { showSuccess, showError } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      showError('Please enter your email');
      return;
    }
    try {
      setLoading(true);
      const res = await authApi.forgotPassword({ email });
      if (res.data?.success) {
        setSubmitted(true);
        showSuccess('If your email is registered, you will receive a reset link.');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="glass-card max-w-md w-full p-6">
        <button onClick={() => navigate('/login')} className="text-slate-400 hover:text-white transition mb-4">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold gradient-text text-center mb-2">Forgot Password</h1>
        <p className="text-slate-400 text-center text-sm mb-6">
          Enter your email and we'll send you a link to reset your password.
        </p>
        {submitted ? (
          <div className="text-center text-emerald-400 py-4">
            <p>✅ Check your email for the reset link.</p>
            <Link to="/login" className="text-cyan-400 hover:underline mt-2 inline-block">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="email"
                  className="input-field pl-10"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex justify-center">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-slate-400">
          Remember your password? <Link to="/login" className="text-cyan-400 hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
