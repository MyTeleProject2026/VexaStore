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
    const token = localStorage.getItem('vexastore_user_token');
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

export const authApi = {
  // Auth
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  verifyOtp: (data) => api.post('/api/auth/verify-otp', data),
  resendOtp: (data) => api.post('/api/auth/resend-otp', data),
  googleLogin: (data) => api.post('/api/auth/google', data),
  forgotPassword: (data) => api.post('/api/auth/forgot-password', data),
  resetPassword: (data) => api.post('/api/auth/reset-password', data),

  // Profile
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
  updateProfileFull: (data) => api.put('/api/auth/profile/full', data),
  updateProfilePicture: (avatar_url) => api.put('/api/auth/profile/picture', { avatar_url }),
  changePassword: (data) => api.post('/api/auth/change-password', data),
  resendVerification: () => api.post('/api/auth/resend-verification'),

  // 2FA
  generate2FA: () => api.post('/api/auth/twofa/generate'),
  verifyEnable2FA: (data) => api.post('/api/auth/twofa/verify-enable', data),
  disable2FA: () => api.post('/api/auth/twofa/disable'),

  // Data & Privacy
  getActivityLog: () => api.get('/api/auth/activity-log'),
  getSessions: () => api.get('/api/auth/sessions'),
  exportData: () => api.get('/api/auth/export-data'),
  deleteAccount: (data) => api.post('/api/auth/delete-account', data),

  // Connected Apps
  getConnectedApps: () => api.get('/api/auth/connected-apps'),
  connectApp: (data) => api.post('/api/auth/connect-app', data),
  disconnectApp: (data) => api.post('/api/auth/disconnect-app', data),
};

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
