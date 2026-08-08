// frontend-user/src/pages/settings/TwoFactorAuth.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { ArrowLeft, Shield, QrCode, CheckCircle, Copy, Key, Lock } from 'lucide-react';

export default function TwoFactorAuth() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [step, setStep] = useState(1);
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [enabled, setEnabled] = useState(false);

  const getToken = () => (
    localStorage.getItem('vexastore_user_token') ||
    localStorage.getItem('userToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    ''
  );

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
      const res = await fetch(`${vexaAccountUrl}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.user?.twofa_enabled) {
        setEnabled(true);
      }
    } catch (err) {}
  };

  const handleGenerate = async () => {
    const token = getToken();
    if (!token) {
      showError('Please login first');
      return;
    }
    try {
      setLoading(true);
      const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
      const res = await fetch(`${vexaAccountUrl}/api/auth/twofa/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSecret(data.secret);
        setQrCode(data.qrCode);
        setStep(2);
      } else {
        showError(data.message || 'Failed to generate 2FA setup');
      }
    } catch (err) {
      showError('Failed to generate 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!token || token.length !== 6) {
      showError('Please enter a valid 6-digit code');
      return;
    }
    const authToken = getToken();
    if (!authToken) {
      showError('Please login first');
      return;
    }
    try {
      setLoading(true);
      const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
      const res = await fetch(`${vexaAccountUrl}/api/auth/twofa/verify-enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ secret, token })
      });
      const data = await res.json();
      if (data.success) {
        setBackupCodes(data.backupCodes || []);
        setStep(3);
        showSuccess('2FA enabled successfully!');
        setEnabled(true);
      } else {
        showError(data.message || 'Invalid verification code');
      }
    } catch (err) {
      showError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    showSuccess('Secret copied!');
  };

  if (enabled) {
    return (
      <div className="min-h-screen bg-dark-bg p-4 flex items-center justify-center">
        <div className="glass-card max-w-md w-full p-6 text-center">
          <Shield size={48} className="text-emerald-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">2FA Already Enabled</h1>
          <p className="text-slate-400 mt-2">Your account is already protected.</p>
          <button onClick={() => navigate('/profile')} className="btn-primary w-full mt-6">Back to Profile</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg p-4">
      <div className="max-w-lg mx-auto">
        <Link to="/profile" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-6">
          <ArrowLeft size={20} /> Back
        </Link>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Shield size={20} className="text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Two‑Factor Authentication</h1>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-slate-400">
                Add an extra layer of security. After enabling, you'll need a one‑time code from your authenticator app every time you sign in.
              </p>
              <ul className="text-sm text-slate-400 space-y-2">
                <li>✅ Use Google Authenticator, Authy, or any TOTP app</li>
                <li>✅ Backup codes will be provided for emergency access</li>
                <li>✅ You can disable 2FA anytime</li>
              </ul>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-black/30 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <Lock size={18} />
                )}
                {loading ? 'Generating...' : 'Enable 2FA'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Scan the QR code with your authenticator app, or enter the secret manually.
              </p>
              <div className="flex justify-center">
                <img src={qrCode} alt="QR Code" className="w-48 h-48 border border-white/10 rounded-xl" />
              </div>
              <div className="bg-dark-bg/50 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm font-mono text-white">{secret}</span>
                <button onClick={handleCopySecret} className="text-cyan-400 hover:text-cyan-300 transition">
                  <Copy size={18} />
                </button>
              </div>
              <div>
                <label className="input-label">Enter 6‑digit code from authenticator</label>
                <input
                  type="text"
                  maxLength="6"
                  className="input-field text-center text-2xl tracking-widest"
                  value={token}
                  onChange={e => setToken(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                />
              </div>
              <button
                onClick={handleVerify}
                disabled={loading || token.length !== 6}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-black/30 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <CheckCircle size={18} />
                )}
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
              <CheckCircle size={48} className="text-emerald-400 mx-auto" />
              <h2 className="text-xl font-bold text-white">2FA Enabled!</h2>
              <p className="text-slate-400">Save these backup codes in a safe place.</p>
              <div className="bg-dark-bg/50 rounded-xl p-4 grid grid-cols-2 gap-2 text-sm font-mono">
                {backupCodes.map((code, i) => (
                  <span key={i} className="text-cyan-300">{code}</span>
                ))}
              </div>
              <button onClick={() => navigate('/profile')} className="btn-primary w-full py-3">Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
