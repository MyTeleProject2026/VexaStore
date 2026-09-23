// frontend-user/src/services/api.js
import axios from 'axios';

// ─── API BASE URLS ──────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api-vexastore.onrender.com';

// ─── AXIOS INSTANCE ──────────────────────────────────────────────────
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ─── REQUEST INTERCEPTOR ────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = 
      localStorage.getItem('vexastore_user_token') ||
      localStorage.getItem('userToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      '';
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR ───────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear all auth tokens
      const keys = [
        'vexastore_user_token', 'userToken', 'token', 'accessToken',
        'vexastore_user', 'user', 'userData'
      ];
      keys.forEach(key => localStorage.removeItem(key));
    }
    return Promise.reject(error);
  }
);

// ─── ERROR HELPER ────────────────────────────────────────────────────
export const getApiErrorMessage = (err) => {
  return err?.response?.data?.message || err?.message || 'Something went wrong';
};

// ─── APP API ─────────────────────────────────────────────────────────
export const appApi = {
  // ─── Apps ──────────────────────────────────────────────────────
  getApps: (params = {}) => api.get('/api/apps', { params }),
  getApp: (slug) => api.get(`/api/apps/${slug}`),
  getFeatured: () => api.get('/api/apps/featured'),

  // ─── Categories ────────────────────────────────────────────────
  getCategories: () => api.get('/api/categories'),
  getCategory: (slug) => api.get(`/api/categories/${slug}`),
  getCategoryApps: (slug, params = {}) => api.get(`/api/categories/${slug}/apps`, { params }),

  // ─── Downloads ────────────────────────────────────────────────
  trackDownload: (data) => api.post('/api/downloads/track', data),

  // ─── News ──────────────────────────────────────────────────────
  getNews: () => api.get('/api/admin/settings/news'),

  // ─── Maintenance ──────────────────────────────────────────────
  getMaintenanceStatus: () => api.get('/api/maintenance/status'),
};

// ─── VEXA ACCOUNT API (For Auth & Profile) ──────────────────────────
export const vexaAccountApi = {
  login: (data) => api.post('/api/auth/login', data).then(r => r.data),
  register: (data) => api.post('/api/auth/register', data).then(r => r.data),
  verifyOtp: (data) => api.post('/api/auth/verify-otp', data).then(r => r.data),
  resendOtp: (data) => api.post('/api/auth/resend-otp', data).then(r => r.data),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }).then(r => r.data),
  resetPassword: (data) => api.post('/api/auth/reset-password', data).then(r => r.data),
  getProfile: () => api.get('/api/auth/profile').then(r => r.data),
  updateProfile: (tokenOrData, maybeData) => api.put('/api/auth/profile', maybeData === undefined ? tokenOrData : maybeData).then(r => r.data),
  updateAvatar: (tokenOrData, maybeData) => api.put('/api/auth/profile/picture', { avatar_url: maybeData === undefined ? tokenOrData : maybeData }).then(r => r.data),
  changePassword: (tokenOrData, maybeData) => api.post('/api/auth/change-password', maybeData === undefined ? tokenOrData : maybeData).then(r => r.data),
  resendVerification: () => api.post('/api/auth/resend-verification').then(r => r.data),
  generate2FA: () => api.post('/api/auth/twofa/generate').then(r => r.data),
  verifyEnable2FA: (tokenOrData, maybeData) => api.post('/api/auth/twofa/verify-enable', maybeData === undefined ? tokenOrData : maybeData).then(r => r.data),
  disable2FA: () => api.post('/api/auth/twofa/disable').then(r => r.data),
  getSessions: () => api.get('/api/auth/sessions').then(r => r.data),
  getActivityLog: () => api.get('/api/auth/activity-log').then(r => r.data),
  getConnectedApps: () => api.get('/api/auth/connected-apps').then(r => r.data),
  connectApp: (data) => api.post('/api/auth/connect-app', data).then(r => r.data),
  disconnectApp: (tokenOrSlug, maybeSlug) => api.post('/api/auth/disconnect-app', { app_slug: maybeSlug === undefined ? tokenOrSlug : maybeSlug }).then(r => r.data),
  exportData: () => api.get('/api/auth/export-data').then(r => r.data),
  deleteAccount: () => api.post('/api/auth/delete-account', { confirm: 'DELETE' }).then(r => r.data),
};

export default api;
