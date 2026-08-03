import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useNotification } from '../hooks/useNotification';

export default function VerifyOtp() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const { showSuccess, showError } = useNotification();

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) { showError('Enter 6-digit OTP'); return; }
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
      await authApi.resendOtp({ email });
      showSuccess('OTP resent');
    } catch (err) {
      showError('Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="glass-card max-w-md w-full p-8">
        <h1 className="text-2xl font-bold gradient-text text-center mb-6">Verify Email</h1>
        <p className="text-text-secondary text-center mb-6">We sent a 6-digit code to {email}</p>
        <form onSubmit={handleVerify} className="space-y-4">
          <input type="text" maxLength="6" className="input-field text-center text-2xl tracking-widest" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="Enter OTP" />
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">{loading ? 'Verifying...' : 'Verify'}</button>
        </form>
        <button onClick={handleResend} className="mt-4 text-sm text-accent-primary hover:underline w-full text-center">Resend OTP</button>
      </div>
    </div>
  );
}