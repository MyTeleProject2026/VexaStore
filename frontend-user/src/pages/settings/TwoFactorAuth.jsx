import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { authApi } from '../../services/api';
import { ArrowLeft, Shield, QrCode, CheckCircle, Copy, Key } from 'lucide-react';

export default function TwoFactorAuth() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [step, setStep] = useState(1); // 1: intro, 2: QR & secret, 3: verify
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Check if 2FA already enabled
    const checkStatus = async () => {
      try {
        const res = await authApi.getProfile();
        if (res.data?.user?.twofa_enabled) {
          setEnabled(true);
        }
      } catch (err) {}
    };
    checkStatus();
  }, []);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const res = await authApi.generate2FA();
      if (res.data?.success) {
        setSecret(res.data.secret);
        setQrCode(res.data.qrCode);
        setStep(2);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to generate 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!token || token.length !== 6) {
      showError('Please enter a valid 6-digit code');
      return;
    }
    try {
      setLoading(true);
      const res = await authApi.verifyEnable2FA({ secret, token });
      if (res.data?.success) {
        setBackupCodes(res.data.backupCodes || []);
        setStep(3);
        showSuccess('2FA enabled successfully!');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Invalid verification code');
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
          <p className="text-slate-400 mt-2">Your account is already protected with two-factor authentication.</p>
          <button
            onClick={() => navigate('/profile')}
            className="btn-primary w-full mt-6"
          >
            Back to Profile
          </button>
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

          {/* Step 1: Intro */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-slate-400">
                Add an extra layer of security to your account. After enabling 2FA, you'll need to enter a one-time code from your authenticator app every time you sign in.
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
                {loading ? 'Generating...' : 'Set up 2FA'}
              </button>
            </div>
          )}

          {/* Step 2: QR & Secret */}
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
                <label className="input-label">Enter 6-digit code from authenticator</label>
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
                {loading ? 'Verifying...' : <CheckCircle size={18} />}
                Verify & Enable
              </button>
            </div>
          )}

          {/* Step 3: Backup Codes */}
          {step === 3 && (
            <div className="space-y-4 text-center">
              <CheckCircle size={48} className="text-emerald-400 mx-auto" />
              <h2 className="text-xl font-bold text-white">2FA Enabled!</h2>
              <p className="text-slate-400">Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.</p>
              <div className="bg-dark-bg/50 rounded-xl p-4 grid grid-cols-2 gap-2 text-sm font-mono">
                {backupCodes.map((code, i) => (
                  <span key={i} className="text-cyan-300">{code}</span>
                ))}
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="btn-primary w-full py-3"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
