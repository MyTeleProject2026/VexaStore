import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const getToken = () => localStorage.getItem('vexastore_admin_token');

export const adminApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
adminApi.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vexastore_admin_token');
      window.location.href = '/';
    }
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject({ ...error, userMessage: message });
  }
);

export const getApiErrorMessage = (err) => {
  return err?.userMessage || err?.response?.data?.message || err?.message || 'Network error';
};

export const api = {
  // Auth
  adminLogin: (data) => adminApi.post('/api/admin/login', data),

  // Apps
  getApps: () => adminApi.get('/api/admin/apps'),
  getApp: (id) => adminApi.get(`/api/admin/apps/${id}`),
  createApp: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return adminApi.post('/api/admin/apps', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateApp: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return adminApi.put(`/api/admin/apps/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteApp: (id) => adminApi.delete(`/api/admin/apps/${id}`),

  // Versions
  addVersion: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return adminApi.post('/api/admin/versions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteVersion: (id) => adminApi.delete(`/api/admin/versions/${id}`),

  // Categories (public)
  getCategories: () => adminApi.get('/api/categories'),

  // Admin Settings Routes
  getAdminCategories: () => adminApi.get('/api/admin/settings/categories'),
  createCategory: (data) => adminApi.post('/api/admin/settings/categories', data),
  updateCategory: (id, data) => adminApi.put(`/api/admin/settings/categories/${id}`, data),
  deleteCategory: (id) => adminApi.delete(`/api/admin/settings/categories/${id}`),

  // News - Handles both FormData and JSON
  getNews: () => adminApi.get('/api/admin/settings/news'),
  createNews: (data) => {
    if (data instanceof FormData) {
      return adminApi.post('/api/admin/settings/news', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return adminApi.post('/api/admin/settings/news', data);
  },
  updateNews: (id, data) => {
    if (data instanceof FormData) {
      return adminApi.put(`/api/admin/settings/news/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return adminApi.put(`/api/admin/settings/news/${id}`, data);
  },
  deleteNews: (id) => adminApi.delete(`/api/admin/settings/news/${id}`),

  // Users
  getUsers: () => adminApi.get('/api/admin/settings/users'),
  updateUser: (id, data) => adminApi.put(`/api/admin/settings/users/${id}`, data),
  deleteUser: (id) => adminApi.delete(`/api/admin/settings/users/${id}`),

  // Settings
  getSettings: () => adminApi.get('/api/admin/settings'),
  updateSettings: (data) => adminApi.put('/api/admin/settings', data),
  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return adminApi.post('/api/admin/settings/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadFavicon: (file) => {
    const formData = new FormData();
    formData.append('favicon', file);
    return adminApi.post('/api/admin/settings/upload-favicon', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Downloads
  getDownloadStats: (period) => adminApi.get(`/api/downloads/stats?period=${period || '30d'}`),

  // Maintenance
  getMaintenanceStatus: () => adminApi.get('/api/maintenance/status'),
  toggleMaintenance: (data) => adminApi.post('/api/admin/maintenance/toggle', data),
};