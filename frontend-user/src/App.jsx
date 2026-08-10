import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { NotificationProvider } from './hooks/useNotification';
import ToastContainer from './components/ToastContainer';
import Layout from './components/Layout';
import MaintenancePage from './components/MaintenancePage';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
import NewsPage from './pages/NewsPage';
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const AppPage = lazy(() => import('./pages/AppPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const Profile = lazy(() => import('./pages/Profile'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Downloads = lazy(() => import('./pages/Downloads'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Settings = lazy(() => import('./pages/Settings'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyOtp = lazy(() => import('./pages/VerifyOtp'));

// Settings Pages
const TwoFactorAuth = lazy(() => import('./pages/settings/TwoFactorAuth'));
const ChangePassword = lazy(() => import('./pages/settings/ChangePassword'));
const ConnectedDevices = lazy(() => import('./pages/settings/ConnectedDevices'));
const DataExport = lazy(() => import('./pages/settings/DataExport'));
const DeleteAccount = lazy(() => import('./pages/settings/DeleteAccount'));
const ActivityLog = lazy(() => import('./pages/settings/ActivityLog'));
const ConnectedApps = lazy(() => import('./pages/settings/ConnectedApps'));

function AppContent() {
  const [maintenance, setMaintenance] = useState({ isEnabled: false, message: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkMaintenance();
  }, []);

  async function checkMaintenance() {
    try {
      const vexaStoreUrl = import.meta.env.VITE_API_BASE_URL || 'https://vexastore-backend.onrender.com';
      const res = await fetch(`${vexaStoreUrl}/api/maintenance/status`);
      const data = await res.json();
      if (data.success) {
        setMaintenance({
          isEnabled: data.data.is_enabled,
          message: data.data.message || '🚧 VexaStore is currently under maintenance. We\'ll be back soon!'
        });
      }
    } catch (err) {
      console.error('Maintenance check failed:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading VexaStore..." />;
  }

  if (maintenance.isEnabled) {
    return <MaintenancePage message={maintenance.message} onRefresh={checkMaintenance} />;
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="news/:slug" element={<NewsPage />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="app/:slug" element={<AppPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="auth/callback" element={<AuthCallback />} />
          <Route path="verify-otp" element={<VerifyOtp />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/edit" element={<EditProfile />} />
          <Route path="change-password" element={<ChangePassword />} />

          {/* ─── Settings Routes ─── */}
          <Route path="settings" element={<Settings />} />
          <Route path="settings/2fa" element={<TwoFactorAuth />} />
          <Route path="settings/devices" element={<ConnectedDevices />} />
          <Route path="settings/export" element={<DataExport />} />
          <Route path="settings/delete" element={<DeleteAccount />} />
          <Route path="settings/activity" element={<ActivityLog />} />
          <Route path="settings/apps" element={<ConnectedApps />} />

          <Route path="downloads" element={<Downloads />} />
          <Route path="favorites" element={<Favorites />} />
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
        <ToastContainer />
      </NotificationProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
