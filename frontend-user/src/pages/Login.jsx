import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { authApi } from '../services/api';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { showSuccess, showError } = useNotification();

  // ============================================================
  // Google OAuth Login
  // ============================================================
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Fetch user info from Google
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        }).then(res => res.json());

        // Send to backend
        const res = await authApi.googleLogin({
          google_id: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name || userInfo.email.split('@')[0]
        });

        if (res.data?.success) {
          localStorage.setItem('vexastore_user_token', res.data.token);
          localStorage.setItem('vexastore_user', JSON.stringify(res.data.user));
          showSuccess('Login successful');
          navigate('/');
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Google login failed';
        console.error('Google login error:', err.response?.data);
        showError(`❌ ${msg}`);
      }
    },
    onError: () => showError('❌ Google login failed. Please try again.'),
  });

  // ============================================================
  // Email/Password Login
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showError('Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.login({ email, password });

      if (res.data?.success) {
        localStorage.setItem('vexastore_user_token', res.data.token);
        localStorage.setItem('vexastore_user', JSON.stringify(res.data.user));
        showSuccess('Login successful');
        navigate('/');
      }
    } catch (err) {
      // ✅ Show exact error from backend
      const msg = err.response?.data?.message || err.message || 'Login failed';
      console.error('Login error:', err.response?.data);
      showError(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="glass-card max-w-md w-full p-6">
        {/* Back Button */}
        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white transition mb-4">
          <ArrowLeft size={20} />
        </button>

        {/* Header */}
        <h1 className="text-2xl font-bold gradient-text text-center mb-2">Welcome Back</h1>
        <p className="text-slate-400 text-center text-sm mb-6">Sign in to access your downloads and favorites</p>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
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

          {/* Password */}
          <div>
            <label className="input-label">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link to="/forgot-password" className="text-xs text-cyan-400 hover:underline">
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex justify-center">
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        {/* Register Link */}
        <p className="mt-4 text-center text-sm text-slate-400">
          Don't have an account? <Link to="/register" className="text-cyan-400 hover:underline">Register</Link>
        </p>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs text-slate-500">
            <span className="bg-dark-bg px-2">OR</span>
          </div>
        </div>

        {/* Google Login Button */}
        <div className="text-center">
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
        </div>
      </div>
    </div>
  );
}
