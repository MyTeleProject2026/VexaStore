import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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

export const appApi = {
  getApps: (params = {}) => api.get('/apps', { params }),
  getApp: (slug) => api.get(`/apps/${slug}`),
  getAppVersions: (slug, os) => api.get(`/apps/${slug}/versions/${os}`),
  getCategories: () => api.get('/categories'),
  trackDownload: (data) => api.post('/downloads/track', data),
};

export const maintenanceApi = {
  getStatus: () => api.get('/maintenance/status'),
};
