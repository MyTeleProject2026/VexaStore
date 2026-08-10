import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://vexastore-backend.onrender.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear all auth tokens
      localStorage.removeItem('vexastore_user_token');
      localStorage.removeItem('userToken');
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('vexastore_user');
      localStorage.removeItem('user');
      localStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (err) => {
  return err?.response?.data?.message || err?.message || 'Something went wrong';
};

export const appApi = {
  // ─── Apps ──────────────────────────────────────────────────
  getApps: (params) => api.get('/api/apps', { params }),
  getApp: (slug) => api.get(`/api/apps/${slug}`),
  getFeatured: () => api.get('/api/apps/featured'),

  // ─── Categories ────────────────────────────────────────────
  getCategories: () => api.get('/api/categories'),
  getCategory: (slug) => api.get(`/api/categories/${slug}`),
  getCategoryApps: (slug, params) => api.get(`/api/categories/${slug}/apps`, { params }),

  // ─── Downloads ─────────────────────────────────────────────
  trackDownload: (data) => api.post('/api/downloads/track', data),

  // ─── Maintenance ───────────────────────────────────────────
  getMaintenanceStatus: () => api.get('/api/maintenance/status'),
};

export default api;
