// frontend-user/src/pages/settings/DeleteAccount.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { ArrowLeft, Trash2, Shield, AlertTriangle, Check, X } from 'lucide-react';

export default function DeleteAccount() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const getToken = () => {
    return (
      localStorage.getItem('vexastore_user_token') ||
      localStorage.getItem('userToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      ''
    );
  };

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      showError('Please type "DELETE" to confirm');
      return;
    }

    if (!agreed) {
      showError('Please agree to the terms');
      return;
    }

    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        showError('Please login first');
        return;
      }

      const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
      const response = await fetch(`${vexaAccountUrl}/api/auth/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ confirm: 'DELETE' })
      });

      const data = await response.json();
      if (data.success) {
        // Clear all local storage
        localStorage.clear();
        showSuccess('Account deleted successfully');
        setStep(3);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        showError(data.message || 'Failed to delete account');
      }
    } catch (err) {
      showError('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Account Deleted</h1>
          <p className="text-slate-400 mt-2">Your account has been permanently deleted.</p>
          <p className="text-sm text-slate-500 mt-4">Redirecting to home page...</p>
        </div>
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
          <Trash2 size={24} className="text-red-400" />
          <h1 className="text-2xl font-bold text-white">Delete Account</h1>
        </div>
        <p className="text-red-400">⚠️ This action is permanent and cannot be undone</p>
      </div>

      <div className="glass-card p-6 space-y-5">
        {step === 1 && (
          <>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-300 font-medium">Before you delete your account:</p>
                  <ul className="text-sm text-slate-400 list-disc list-inside mt-2 space-y-1">
                    <li>All your data will be permanently deleted</li>
                    <li>You will lose access to all Vexa apps</li>
                    <li>Your downloads and favorites will be removed</li>
                    <li>This action cannot be reversed</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="btn-danger w-full flex items-center justify-center gap-2 py-3"
            >
              <Trash2 size={18} /> I understand, continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <Shield size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-300 font-medium">Final Confirmation Required</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Please type <span className="text-white font-bold">DELETE</span> to confirm account deletion.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="input-label">Type DELETE to confirm</label>
              <input
                type="text"
                className="input-field text-center text-2xl tracking-widest font-bold"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value.toUpperCase())}
                placeholder="DELETE"
                autoFocus
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="w-4 h-4 accent-red-500"
              />
              I understand that this action is permanent and irreversible
            </label>

            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={loading || confirmText !== 'DELETE' || !agreed}
                className="btn-danger flex-1 flex items-center justify-center gap-2 py-3"
              >
                {loading ? <span className="spinner-small" /> : <Trash2 size={18} />}
                {loading ? 'Deleting...' : 'Permanently Delete Account'}
              </button>
              <button
                onClick={() => setStep(1)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
