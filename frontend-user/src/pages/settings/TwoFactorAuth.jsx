// frontend-user/src/pages/settings/TwoFactorAuth.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { ArrowLeft, Shield, QrCode, Key, Check, Copy, RefreshCw } from 'lucide-react';

export default function TwoFactorAuth() {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copied, setCopied] = useState(false);

  const getToken = () => {
    return (
      localStorage.getItem('vexastore_user_token') ||
      localStorage.getItem('userToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      ''
    );
  };

  const VEXA_ACCOUNT_URL = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';

  useEffect(() => {
    load2FAStatus();
  }, []);

  const load2FAStatus = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${VEXA_ACCOUNT_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setEnabled(data.user.twofa_enabled === 1);
      }
    } catch (err) {
      console.error('Load 2FA status error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generate2FA = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        showError('Please login first');
        return;
      }

      const response = await fetch(`${VEXA_ACCOUNT_URL}/api/auth/twofa/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setSecret(data.secret);
        setQrCode(data.qrCode);
        setShowBackupCodes(false);
        setBackupCodes([]);
        showSuccess('2FA setup initialized. Scan the QR code with your authenticator app.');
      } else {
        showError(data.message || 'Failed to generate 2FA');
      }
    } catch (err) {
      showError('Failed to generate 2FA');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showError('Please enter a valid 6-digit verification code');
      return;
    }

    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        showError('Please login first');
        return;
      }

      const response = await fetch(`${VEXA_ACCOUNT_URL}/api/auth/twofa/verify-enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          secret,
          token: verificationCode
        })
      });

      const data = await response.json();
      if (data.success) {
        setEnabled(true);
        setBackupCodes(data.backupCodes || []);
        setShowBackupCodes(true);
        setVerificationCode('');
        showSuccess('2FA enabled successfully! Save your backup codes.');
      } else {
        showError(data.message || 'Invalid verification code');
      }
    } catch (err) {
      showError('Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) return;

    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        showError('Please login first');
        return;
      }

      const response = await fetch(`${VEXA_ACCOUNT_URL}/api/auth/twofa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setEnabled(false);
        setSecret('');
        setQrCode('');
        setBackupCodes([]);
        setShowBackupCodes(false);
        showSuccess('2FA disabled successfully');
      } else {
        showError(data.message || 'Failed to disable 2FA');
      }
    } catch (err) {
      showError('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    if (backupCodes.length > 0) {
      navigator.clipboard.writeText(backupCodes.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showSuccess('Backup codes copied to clipboard');
    }
  };

  if (loading && !secret) {
    return (
      <div className="flex justify-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/profile" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition">
        <ArrowLeft size={20} /> Back to Profile
      </Link>

      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={24} className="text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">Two-Factor Authentication</h1>
        </div>
        <p className="text-slate-400">
          {enabled
            ? '2FA is enabled. Your account is more secure.'
            : 'Add an extra layer of security to your account.'}
        </p>
      </div>

      {enabled ? (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Check size={20} className="text-emerald-400" />
            <div>
              <p className="text-white font-medium">2FA is Active</p>
              <p className="text-sm text-slate-400">Your account is protected by two-factor authentication.</p>
            </div>
          </div>
          <button onClick={disable2FA} disabled={loading} className="btn-danger w-full">
            {loading ? 'Disabling...' : 'Disable 2FA'}
          </button>
        </div>
      ) : secret ? (
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Set Up 2FA</h2>

          <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
            <p className="text-sm text-slate-400">
              1. Install an authenticator app (Google Authenticator, Authy, or Microsoft Authenticator).
              <br />
              2. Scan the QR code below.
              <br />
              3. Enter the 6-digit code from your app.
            </p>
          </div>

          {qrCode && (
            <div className="flex flex-col items-center p-4 bg-white rounded-xl">
              <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              <p className="text-xs text-slate-500 mt-2">Scan this QR code with your authenticator app</p>
            </div>
          )}

          {secret && (
            <div className="p-4 rounded-xl bg-[#050812] border border-white/5">
              <p className="text-xs text-slate-500">Secret Key (manual entry)</p>
              <p className="font-mono text-sm text-cyan-400 break-all">{secret}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(secret);
                  showSuccess('Secret key copied');
                }}
                className="text-xs text-cyan-400 hover:underline mt-1"
              >
                Copy Secret Key
              </button>
            </div>
          )}

          <div>
            <label className="input-label">Verification Code</label>
            <input
              type="text"
              className="input-field text-center text-2xl tracking-widest"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={verifyAndEnable}
              disabled={loading || !verificationCode}
              className="btn-primary flex-1"
            >
              {loading ? 'Verifying...' : 'Enable 2FA'}
            </button>
            <button
              onClick={() => {
                setSecret('');
                setQrCode('');
                setVerificationCode('');
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-500/10 border border-slate-500/20">
            <Shield size={20} className="text-slate-400" />
            <div>
              <p className="text-white font-medium">2FA is Disabled</p>
              <p className="text-sm text-slate-400">Enable 2FA to secure your account.</p>
            </div>
          </div>
          <button onClick={generate2FA} disabled={loading} className="btn-primary flex items-center justify-center gap-2">
            <Key size={18} /> {loading ? 'Loading...' : 'Set Up 2FA'}
          </button>
        </div>
      )}

      {showBackupCodes && backupCodes.length > 0 && (
        <div className="glass-card p-6 space-y-4 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Backup Codes</h3>
            <button onClick={copyBackupCodes} className="text-cyan-400 hover:underline text-sm flex items-center gap-1">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy All'}
            </button>
          </div>
          <p className="text-sm text-amber-400">⚠️ Store these backup codes in a safe place. Each code can only be used once.</p>
          <div className="grid grid-cols-2 gap-2 p-4 rounded-xl bg-[#050812] border border-white/5">
            {backupCodes.map((code, index) => (
              <div key={index} className="font-mono text-sm text-cyan-300 bg-white/5 p-2 rounded-lg text-center">
                {code}
              </div>
            ))}
          </div>
          <button onClick={() => setShowBackupCodes(false)} className="text-slate-400 hover:text-white text-sm">
            I've saved my backup codes
          </button>
        </div>
      )}
    </div>
  );
}
