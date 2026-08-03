import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './services/api';
import { NotificationProvider, useNotification } from './hooks/useNotification';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Apps from './pages/Apps';
import AddApp from './pages/AddApp';
import EditApp from './pages/EditApp';
import Versions from './pages/Versions';
import Analytics from './pages/Analytics';
import Maintenance from './pages/Maintenance';
// ========== ADD: New Pages ==========
import Categories from './pages/Categories';
import Users from './pages/Users';
import News from './pages/News';
import Settings from './pages/Settings';

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
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading VexaStore Admin...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // ========== CORRECTED JSX STRUCTURE ==========
  return (
    <BrowserRouter>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/apps" element={<Apps />} />
          <Route path="/apps/add" element={<AddApp />} />
          <Route path="/apps/edit/:id" element={<EditApp />} />
          <Route path="/apps/:id/versions" element={<Versions />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/maintenance" element={<Maintenance />} />
          {/* ========== ADD: New Routes ========== */}
          <Route path="/categories" element={<Categories />} />
          <Route path="/users" element={<Users />} />
          <Route path="/news" element={<News />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

export default App;