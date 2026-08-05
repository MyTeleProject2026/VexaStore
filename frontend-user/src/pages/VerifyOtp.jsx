import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { useNotification } from '../hooks/useNotification';
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
      showError('Enter 6-digit OTP');
      return;
    }
    try {
      setLoading(true);
      await authApi.verifyOtp({ email, otp });
      showSuccess('Email verified! Please login.');
      navigate('/login');
    } catch (err) {
      showError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      await authApi.resendOtp({ email });
      showSuccess('OTP resent');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to resend OTP';
      console.error('Resend error:', err.response?.data);
      showError(`❌ ${msg}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="glass-card max-w-md w-full p-6">
        <Link to="/register" className="text-slate-400 hover:text-white transition mb-4 inline-block">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold gradient-text text-center mb-2">Verify Email</h1>
        <p className="text-slate-400 text-center text-sm mb-6">
          We sent a 6-digit code to <span className="text-white font-medium">{email}</span>
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
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex justify-center">
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
        <button
          onClick={handleResend}
          disabled={resending}
          className="mt-4 text-sm text-cyan-400 hover:underline w-full text-center"
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
