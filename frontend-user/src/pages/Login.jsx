// frontend-user/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, LogIn } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

// ─── VexaAccount SVG Icon ───
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

export default function Login() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // ✅ Only initialize Google login if client_id is available
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        }).then(res => res.json());

        const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
        const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);

        sessionStorage.setItem('google_user_info', JSON.stringify({
          google_id: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name || userInfo.email.split('@')[0]
        }));

        window.location.href = `${vexaAccountUrl}/api/auth/google?redirect_uri=${redirectUri}`;
      } catch (err) {
        showError(err.message || 'Google login failed');
      }
    },
    onError: () => showError('Google login failed'),
    // ✅ Only enable if client_id exists
    enabled: !!GOOGLE_CLIENT_ID,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';

      const response = await fetch(`${vexaAccountUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem('vexastore_user_token', data.token);
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('accessToken', data.token);

        if (data.user) {
          localStorage.setItem('vexastore_user', JSON.stringify(data.user));
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('userData', JSON.stringify(data.user));
        }

        showSuccess('Login successful');
        navigate('/');
      } else {
        showError(data.message || 'Login failed');
      }
    } catch (err) {
      showError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVexaAccountLogin = () => {
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
    const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
    window.location.href = `${vexaAccountUrl}/api/auth/login?redirect_uri=${redirectUri}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050812] p-4">
      <div className="glass-card max-w-md w-full p-6">
        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white transition mb-4">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold gradient-text text-center mb-2">Welcome Back</h1>
        <p className="text-slate-400 text-center text-sm mb-6">Sign in to access your downloads and favorites</p>

        {/* ─── VexaAccount SSO ─── */}
        <button
          onClick={handleVexaAccountLogin}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 font-semibold text-cyan-300 transition hover:bg-cyan-500/20 mb-4"
        >
          <VexaAccountIcon className="w-5 h-5" />
          Continue with VexaAccount
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
          <div className="relative flex justify-center text-xs text-slate-500"><span className="bg-dark-bg px-2">OR</span></div>
        </div>

        {/* ─── Manual Login ─── */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
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
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field pl-10 pr-12"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="text-right">
            <Link to="/forgot-password" className="text-xs text-cyan-400 hover:underline">
              Forgot Password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 flex justify-center items-center gap-2"
          >
            {loading ? <span className="spinner-small" /> : <LogIn size={18} />}
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-400">
          Don't have an account? <Link to="/register" className="text-cyan-400 hover:underline">Register</Link>
        </p>

        {/* ─── Google OAuth ─── */}
        {GOOGLE_CLIENT_ID ? (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <div className="relative flex justify-center text-xs text-slate-500"><span className="bg-dark-bg px-2">OR</span></div>
            </div>

            <button
              onClick={googleLogin}
              className="btn-secondary w-full flex items-center justify-center gap-2 py-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Continue with Google
            </button>
          </>
        ) : (
          <div className="text-center text-xs text-amber-400 mt-4 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            Google login is not configured. Please use VexaAccount or manual login.
          </div>
        )}
      </div>
    </div>
  );
}
