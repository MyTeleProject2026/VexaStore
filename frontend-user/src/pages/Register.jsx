// frontend-user/src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { ArrowLeft } from 'lucide-react';

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
  const { showInfo } = useNotification();
  const [loading, setLoading] = useState(false);

  const handleVexaAccountRegister = () => {
    setLoading(true);
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
    const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
    window.location.href = `${vexaAccountUrl}/api/auth/register?redirect_uri=${redirectUri}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050812] p-4">
      <div className="glass-card max-w-md w-full p-6">
        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white transition mb-4">
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-2xl font-bold gradient-text text-center mb-2">Create Account</h1>
        <p className="text-slate-400 text-center text-sm mb-6">Join VexaStore and start downloading</p>

        <button
          onClick={handleVexaAccountRegister}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-4 font-semibold text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-60"
        >
          <VexaAccountIcon className="w-5 h-5" />
          {loading ? 'Redirecting...' : 'Register with VexaAccount'}
        </button>

        <p className="mt-4 text-center text-sm text-slate-400">
          Already have an account? <Link to="/login" className="text-cyan-400 hover:underline">Sign In</Link>
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Account Setup</p>
          <p className="mt-2 text-sm text-slate-400">
            After registration, you can access all Vexa apps with one account
          </p>
        </div>
      </div>
    </div>
  );
}
