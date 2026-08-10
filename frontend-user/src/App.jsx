// frontend-user/src/App.jsx
import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { NotificationProvider } from './hooks/useNotification';
import ToastContainer from './components/ToastContainer';
import Layout from './components/Layout';
import MaintenancePage from './components/MaintenancePage';
import LoadingSpinner from './components/LoadingSpinner';

// ─── LAZY LOAD PAGES ──────────────────────────────────────────────────
const HomePage = lazy(() => import('./pages/HomePage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const AppPage = lazy(() => import('./pages/AppPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const VerifyOtp = lazy(() => import('./pages/VerifyOtp'));
const Profile = lazy(() => import('./pages/Profile'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Downloads = lazy(() => import('./pages/Downloads'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Settings = lazy(() => import('./pages/Settings'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const NewsPage = lazy(() => import('./pages/NewsPage'));

// ─── SETTINGS PAGES ──────────────────────────────────────────────────
const TwoFactorAuth = lazy(() => import('./pages/settings/TwoFactorAuth'));
const ChangePassword = lazy(() => import('./pages/settings/ChangePassword'));
const ConnectedDevices = lazy(() => import('./pages/settings/ConnectedDevices'));
const DataExport = lazy(() => import('./pages/settings/DataExport'));
const DeleteAccount = lazy(() => import('./pages/settings/DeleteAccount'));
const ActivityLog = lazy(() => import('./pages/settings/ActivityLog'));
const ConnectedApps = lazy(() => import('./pages/settings/ConnectedApps'));

// ─── APP CONTENT ──────────────────────────────────────────────────────
function AppContent() {
  const [maintenance, setMaintenance] = useState({ isEnabled: false, message: '' });
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api-vexastore.onrender.com';

  useEffect(() => {
    checkMaintenance();
  }, []);

  async function checkMaintenance() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/maintenance/status`);
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
          {/* ─── PUBLIC ROUTES ──────────────────────────────────── */}
          <Route index element={<HomePage />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="app/:slug" element={<AppPage />} />
          <Route path="search" element={<SearchPage />} />

          {/* ─── AUTH ROUTES ────────────────────────────────────── */}
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="auth/callback" element={<AuthCallback />} />
          <Route path="verify-otp" element={<VerifyOtp />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />

          {/* ─── PROFILE & SETTINGS ────────────────────────────── */}
          <Route path="profile" element={<Profile />} />
          <Route path="profile/edit" element={<EditProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/2fa" element={<TwoFactorAuth />} />
          <Route path="settings/devices" element={<ConnectedDevices />} />
          <Route path="settings/export" element={<DataExport />} />
          <Route path="settings/delete" element={<DeleteAccount />} />
          <Route path="settings/activity" element={<ActivityLog />} />
          <Route path="settings/apps" element={<ConnectedApps />} />
          <Route path="change-password" element={<ChangePassword />} />

          {/* ─── OTHER PAGES ────────────────────────────────────── */}
          <Route path="downloads" element={<Downloads />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="news/:slug" element={<NewsPage />} />

          {/* ─── FALLBACK ───────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────
function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={clientId} onScriptLoadError={() => console.warn('Google OAuth script failed to load')}>
      <NotificationProvider>
        <Suspense fallback={<LoadingSpinner message="Loading..." />}>
          <AppContent />
        </Suspense>
        <ToastContainer />
      </NotificationProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
