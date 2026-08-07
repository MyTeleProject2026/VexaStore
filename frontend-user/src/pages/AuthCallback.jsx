// frontend-user/src/pages/AuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userParam = params.get('user');

    console.log('🔐 [AuthCallback] Full URL:', window.location.href);
    console.log('🔐 [AuthCallback] Token present:', !!token);

    if (token) {
      // ✅ Store token with VexaStore keys
      localStorage.setItem('vexastore_user_token', token);
      localStorage.setItem('vexastore_user', userParam || '');

      // ✅ Also store with generic keys for backward compatibility
      localStorage.setItem('userToken', token);
      localStorage.setItem('token', token);
      localStorage.setItem('accessToken', token);

      if (userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('userData', JSON.stringify(user));
          localStorage.setItem('vexastore_user', JSON.stringify(user));
        } catch (e) {
          console.error('Failed to parse user data:', e);
        }
      }

      showSuccess('Login successful!');
      navigate('/', { replace: true });
    } else {
      const error = params.get('error');
      const registered = params.get('registered');
      
      if (registered === 'true') {
        showSuccess('Account created! Please login.');
        navigate('/login', { replace: true });
        return;
      }
      
      showError(error || 'Authentication failed. Please try again.');
      navigate('/login', { replace: true });
    }
  }, [location, navigate, showSuccess, showError]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-text-secondary mt-4">Completing authentication...</p>
      </div>
    </div>
  );
}
