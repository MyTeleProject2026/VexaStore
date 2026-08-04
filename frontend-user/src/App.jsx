import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { api } from './services/api';
import Layout from './components/Layout';
import MaintenancePage from './components/MaintenancePage';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import AppPage from './pages/AppPage';
import SearchPage from './pages/SearchPage';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import Profile from './pages/Profile';
import Downloads from './pages/Downloads';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { NotificationProvider, useNotification } from './hooks/useNotification';

function AppContent() {
  const [maintenance, setMaintenance] = useState({ isEnabled: false, message: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkMaintenance();
  }, []);

  async function checkMaintenance() {
    try {
      const res = await api.get('/api/maintenance/status');
      if (res.data?.success) {
        setMaintenance({
          isEnabled: res.data.data.is_enabled,
          message: res.data.data.message || '🚧 VexaStore is currently under maintenance. We\'ll be back soon!'
        });
      }
    } catch (err) {
      console.error('Maintenance check failed:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading VexaStore...</p>
        </div>
      </div>
    );
  }

  if (maintenance.isEnabled) {
    return <MaintenancePage message={maintenance.message} onRefresh={checkMaintenance} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="app/:slug" element={<AppPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="verify-otp" element={<VerifyOtp />} />
          <Route path="profile" element={<Profile />} />
          <Route path="downloads" element={<Downloads />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  // Use the environment variable for Google Client ID
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
