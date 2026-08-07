// frontend-user/src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // ✅ Check all possible token keys
    const token = 
      localStorage.getItem('vexastore_user_token') ||
      localStorage.getItem('userToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken');
      
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject({ ...error, userMessage: message });
  }
);

export const getApiErrorMessage = (err) => {
  return err?.userMessage || err?.response?.data?.message || err?.message || 'Network error';
};

// ✅ REMOVED authApi – authentication now handled by VexaAccount SSO
// All auth methods (login, register, OTP, etc.) are removed

export const appApi = {
  getApps: (params = {}) => api.get('/api/apps', { params }),
  getApp: (slug) => api.get(`/api/apps/${slug}`),
  getAppVersions: (slug, os) => api.get(`/api/apps/${slug}/versions/${os}`),
  getCategories: () => api.get('/api/categories'),
  trackDownload: (data) => api.post('/api/downloads/track', data),
};

export const maintenanceApi = {
  getStatus: () => api.get('/api/maintenance/status'),
};

export default api;
