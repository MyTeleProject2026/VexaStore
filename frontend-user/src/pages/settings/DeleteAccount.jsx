import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { authApi } from '../../services/api';
import { ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';

export default function DeleteAccount() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      showError('Type "DELETE" exactly to confirm');
      return;
    }
    try {
      setLoading(true);
      await authApi.deleteAccount({ confirm: confirmText });
      showSuccess('Account deleted successfully');
      localStorage.removeItem('vexastore_user_token');
      localStorage.removeItem('vexastore_user');
      navigate('/');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg p-4">
      <div className="max-w-lg mx-auto">
        <Link to="/profile" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-6">
          <ArrowLeft size={20} /> Back
        </Link>

        <div className="glass-card p-6 border-red-500/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Trash2 size={20} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Delete Account</h1>
          </div>

          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 font-medium">This action is permanent</p>
                  <p className="text-sm text-slate-400 mt-1">
                    All your data, including profile, activity logs, and connected apps will be permanently deleted.
                    This cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="input-label">Type <span className="text-red-400 font-bold">DELETE</span> to confirm</label>
              <input
                type="text"
                className="input-field"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="DELETE"
              />
            </div>

            <button
              onClick={handleDelete}
              disabled={loading || confirmText !== 'DELETE'}
              className="btn-danger w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting...' : 'Permanently Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
