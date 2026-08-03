import { useState } from 'react';
import { api, getApiErrorMessage } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { Download, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { showError } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Please enter email and password');
      return;
    }

    try {
      setLoading(true);
      const res = await api.adminLogin({ email, password });
      if (res.data?.success) {
        onLogin(res.data.token);
      }
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="glass-card max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-accent-primary/20 flex items-center justify-center mx-auto mb-4">
            <Download size={28} className="text-accent-primary" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">VexaStore Admin</h1>
          <p className="text-text-secondary mt-2 text-sm">
            Manage apps for the VexaTrade Blockchain Ecosystem
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vexastore.com"
                className="input-field pl-10"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="input-label">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input-field pl-10 pr-12"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-black/30 border-t-transparent rounded-full animate-spin"></span>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-text-secondary border-t border-dark-border pt-4">
          <p>VexaStore — The Official App Hub of VexaTrade Blockchain Ecosystem</p>
        </div>
      </div>
    </div>
  );
}
