import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// ✅ Create axios instance with base URL
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject({ ...error, userMessage: message });
  }
);

export const getApiErrorMessage = (err) => {
  return err?.userMessage || err?.response?.data?.message || err?.message || 'Network error';
};

// ============================================================
// ✅ Auth API (all paths now include /api)
// ============================================================
export const authApi = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  verifyOtp: (data) => api.post('/api/auth/verify-otp', data),
  resendOtp: (data) => api.post('/api/auth/resend-otp', data),
  googleLogin: (data) => api.post('/api/auth/google', data),
};

// ============================================================
// ✅ App API (all paths now include /api)
// ============================================================
export const appApi = {
  getApps: (params = {}) => api.get('/api/apps', { params }),
  getApp: (slug) => api.get(`/api/apps/${slug}`),
  getAppVersions: (slug, os) => api.get(`/api/apps/${slug}/versions/${os}`),
  getCategories: () => api.get('/api/categories'),
  trackDownload: (data) => api.post('/api/downloads/track', data),
};

// ============================================================
// ✅ Maintenance API
// ============================================================
export const maintenanceApi = {
  getStatus: () => api.get('/api/maintenance/status'),
};

export default api;
