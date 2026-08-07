// frontend-user/src/App.jsx
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
import AuthCallback from './pages/AuthCallback'; // ✅ New
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Downloads from './pages/Downloads';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Settings Pages
import TwoFactorAuth from './pages/settings/TwoFactorAuth';
import ChangePassword from './pages/settings/ChangePassword';
import ConnectedDevices from './pages/settings/ConnectedDevices';
import DataExport from './pages/settings/DataExport';
import DeleteAccount from './pages/settings/DeleteAccount';
import ActivityLog from './pages/settings/ActivityLog';
import ConnectedApps from './pages/settings/ConnectedApps';

import { NotificationProvider } from './hooks/useNotification';

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
          
          {/* ✅ Auth Callback Route */}
          <Route path="auth/callback" element={<AuthCallback />} />
          
          {/* Profile & Settings */}
          <Route path="profile" element={<Profile />} />
          <Route path="profile/edit" element={<EditProfile />} />
          <Route path="change-password" element={<ChangePassword />} />
          
          {/* Settings Pages */}
          <Route path="settings/2fa" element={<TwoFactorAuth />} />
          <Route path="settings/devices" element={<ConnectedDevices />} />
          <Route path="settings/export" element={<DataExport />} />
          <Route path="settings/delete" element={<DeleteAccount />} />
          <Route path="settings/activity" element={<ActivityLog />} />
          <Route path="settings/apps" element={<ConnectedApps />} />
          
          {/* Other Pages */}
          <Route path="downloads" element={<Downloads />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="settings" element={<Settings />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
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
