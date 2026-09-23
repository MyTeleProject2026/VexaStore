// frontend-user/src/pages/VerifyOtp.jsx
import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { vexaAccountApi, getApiErrorMessage } from '../services/api';
import { ArrowLeft } from 'lucide-react';

export default function VerifyOtp() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const { showSuccess, showError } = useNotification();

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      showError('Please enter a valid 6-digit OTP');
      return;
    }
    try {
      setLoading(true);
      const data = await vexaAccountApi.verifyOtp({ email, otp });
      if (data.success) {
        showSuccess('Email verified successfully! Please login.');
        navigate('/login');
      } else {
        showError(data.message || 'Verification failed');
      }
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      showError('Email not found. Please go back and register again.');
      return;
    }
    try {
      setResending(true);
      const data = await vexaAccountApi.resendOtp({ email });
      if (data.success) {
        showSuccess('OTP resent successfully! Check your email.');
      } else {
        showError(data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="glass-card max-w-md w-full p-6">
        <Link to="/register" className="text-slate-400 hover:text-white transition mb-4 inline-block">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold gradient-text text-center mb-2">Verify Email</h1>
        <p className="text-slate-400 text-center text-sm mb-2">
          We sent a 6-digit code to <span className="text-white font-medium">{email || 'your email'}</span>
        </p>
        <p className="text-slate-500 text-center text-xs mb-6">
          Check your inbox or spam folder.
        </p>
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="input-label text-center block">Enter OTP</label>
            <input
              type="text"
              maxLength="6"
              className="input-field text-center text-2xl tracking-widest"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              autoFocus
            />
          </div>
          <button type="submit" disabled={loading || !email} className="btn-primary w-full py-3 flex justify-center">
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
        <button
          onClick={handleResend}
          disabled={resending || !email}
          className="mt-4 text-sm text-cyan-400 hover:underline w-full text-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resending ? 'Sending...' : 'Resend OTP'}
        </button>
        <p className="mt-4 text-center text-xs text-slate-500">
          Didn't receive the code? Check your spam folder or try resending.
        </p>
      </div>
    </div>
  );
}
