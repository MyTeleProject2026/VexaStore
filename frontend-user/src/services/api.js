// frontend-user/src/services/api.js
import axios from 'axios';

// ─── API BASE URLS ──────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api-vexastore.onrender.com';
const VEXA_ACCOUNT_URL = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';

// ─── AXIOS INSTANCE ──────────────────────────────────────────────────
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
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
  // ─── Auth ──────────────────────────────────────────────────────
  login: (data) => fetch(`${VEXA_ACCOUNT_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(res => res.json()),

  register: (data) => fetch(`${VEXA_ACCOUNT_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(res => res.json()),

  forgotPassword: (email) => fetch(`${VEXA_ACCOUNT_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }).then(res => res.json()),

  resetPassword: (data) => fetch(`${VEXA_ACCOUNT_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(res => res.json()),

  // ─── Profile ──────────────────────────────────────────────────
  getProfile: (token) => fetch(`${VEXA_ACCOUNT_URL}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => res.json()),

  updateProfile: (token, data) => fetch(`${VEXA_ACCOUNT_URL}/api/auth/profile/full`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  }).then(res => res.json()),

  updateAvatar: (token, avatarData) => fetch(`${VEXA_ACCOUNT_URL}/api/auth/profile/picture`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ avatar_url: avatarData }),
  }).then(res => res.json()),

  changePassword: (token, data) => fetch(`${VEXA_ACCOUNT_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  }).then(res => res.json()),

  resendVerification: (token) => fetch(`${VEXA_ACCOUNT_URL}/api/auth/resend-verification`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => res.json()),

  // ─── 2FA ──────────────────────────────────────────────────────
  generate2FA: (token) => fetch(`${VEXA_ACCOUNT_URL}/api/auth/twofa/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  }).then(res => res.json()),

  verifyEnable2FA: (token, data) => fetch(`${VEXA_ACCOUNT_URL}/api/auth/twofa/verify-enable`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  }).then(res => res.json()),

  disable2FA: (token) => fetch(`${VEXA_ACCOUNT_URL}/api/auth/twofa/disable`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  }).then(res => res.json()),

  // ─── Sessions & Activity ──────────────────────────────────────
  getSessions: (token) => fetch(`${VEXA_ACCOUNT_URL}/api/auth/sessions`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => res.json()),

  getActivityLog: (token) => fetch(`${VEXA_ACCOUNT_URL}/api/auth/activity-log`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => res.json()),

  // ─── Connected Apps ────────────────────────────────────────────
  getConnectedApps: (token) => fetch(`${VEXA_ACCOUNT_URL}/api/auth/connected-apps`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => res.json()),

  disconnectApp: (token, appSlug) => fetch(`${VEXA_ACCOUNT_URL}/api/auth/disconnect-app`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ app_slug: appSlug }),
  }).then(res => res.json()),

  // ─── Data Export ──────────────────────────────────────────────
  exportData: (token) => fetch(`${VEXA_ACCOUNT_URL}/api/auth/export-data`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => res.json()),

  // ─── Delete Account ────────────────────────────────────────────
  deleteAccount: (token) => fetch(`${VEXA_ACCOUNT_URL}/api/auth/delete-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ confirm: 'DELETE' }),
  }).then(res => res.json()),
};

export default api;
