// frontend-user/src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react';

// ✅ VexaAccount SVG Icon
const VexaAccountIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="vGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06b6d4"/>
        <stop offset="100%" stopColor="#10b981"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="20" ry="20" fill="#0a0e1a" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"/>
    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="1"/>
    <g transform="translate(50, 50) scale(0.8)">
      <path d="M-25,-25 L-5,15 L5,15 L25,-25" fill="none" stroke="url(#vGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M25,-25 L5,15" fill="none" stroke="url(#vGrad)" strokeWidth="6" strokeLinecap="round"/>
      <path d="M-12,22 L0,30 L12,22" fill="none" stroke="url(#vGrad)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="0" cy="-28" r="4" fill="#06b6d4"/>
      <circle cx="0" cy="-28" r="8" fill="none" stroke="rgba(6,182,212,0.3)" strokeWidth="1.5"/>
    </g>
    <circle cx="30" cy="30" r="20" fill="rgba(255,255,255,0.03)"/>
  </svg>
);

export default function Register() {
  const navigate = useNavigate();
  const { showError } = useNotification();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Register with VexaAccount (SSO)
  const handleVexaAccountRegister = () => {
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
    const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
    window.location.href = `${vexaAccountUrl}/api/auth/register?redirect_uri=${redirectUri}`;
  };

  // ✅ Manual registration via VexaAccount (redirect)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showError('Please fill all fields');
      return;
    }
    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    // Redirect to VexaAccount with prefilled data
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
    const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
    window.location.href = `${vexaAccountUrl}/api/auth/register?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&redirect_uri=${redirectUri}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="glass-card max-w-md w-full p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white transition">
            <ArrowLeft size={20} />
          </button>
        </div>

        <>
          <h1 className="text-2xl font-bold gradient-text text-center mb-2">Create Account</h1>
          <p className="text-slate-400 text-center text-sm mb-6">Join VexaStore and start downloading</p>

          {/* ✅ Register with VexaAccount SSO Button */}
          <button
            onClick={handleVexaAccountRegister}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 font-semibold text-cyan-300 transition hover:bg-cyan-500/20 mb-4"
          >
            <VexaAccountIcon className="w-5 h-5" />
            Register with VexaAccount
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs text-slate-500">
              <span className="bg-dark-bg px-2">OR</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  className="input-field pl-10"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
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
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pl-10 pr-12"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
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
              <label className="input-label">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pl-10"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
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
                <Shield size={18} />
              )}
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-400">
            Already have an account? <Link to="/login" className="text-cyan-400 hover:underline">Sign In</Link>
          </p>
        </>
      </div>
    </div>
  );
}
