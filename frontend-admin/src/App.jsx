import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider, useNotification } from './hooks/useNotification';
import ToastContainer from './components/ToastContainer';
import Layout from './components/Layout';
import Login from './pages/Login';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Apps = lazy(() => import('./pages/Apps'));
const AddApp = lazy(() => import('./pages/AddApp'));
const EditApp = lazy(() => import('./pages/EditApp'));
const Versions = lazy(() => import('./pages/Versions'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const Categories = lazy(() => import('./pages/Categories'));
const Users = lazy(() => import('./pages/Users'));
const News = lazy(() => import('./pages/News'));
const Settings = lazy(() => import('./pages/Settings'));

// ─── APP CONTENT ────────────────────────────────────────────────
function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotification();

  useEffect(() => {
    const token = localStorage.getItem('vexastore_admin_token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem('vexastore_admin_token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('vexastore_admin_token');
    setIsAuthenticated(false);
  };

  if (loading) {
    return <LoadingSpinner message="Loading VexaStore Admin..." />;
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout onLogout={handleLogout}>
        <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/apps" element={<Apps />} />
            <Route path="/apps/add" element={<AddApp />} />
            <Route path="/apps/edit/:id" element={<EditApp />} />
            <Route path="/apps/:id/versions" element={<Versions />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/users" element={<Users />} />
            <Route path="/news" element={<News />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────
function App() {
  return (
    <NotificationProvider>
      <AppContent />
      <ToastContainer />
    </NotificationProvider>
  );
}

export default App;
