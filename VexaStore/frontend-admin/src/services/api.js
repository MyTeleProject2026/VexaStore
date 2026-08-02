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

// Admin API methods
export const api = {
  // Auth
  adminLogin: (data) => adminApi.post('/admin/login', data),
  
  // Apps
  getApps: () => adminApi.get('/admin/apps'),
  getApp: (id) => adminApi.get(`/admin/apps/${id}`),
  createApp: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return adminApi.post('/admin/apps', formData, {
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
    return adminApi.put(`/admin/apps/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteApp: (id) => adminApi.delete(`/admin/apps/${id}`),
  
  // Versions
  addVersion: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return adminApi.post('/admin/versions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteVersion: (id) => adminApi.delete(`/admin/versions/${id}`),
  
  // Categories
  getCategories: () => adminApi.get('/categories'),
  
  // Downloads
  getDownloadStats: (period) => adminApi.get(`/downloads/stats?period=${period || '30d'}`),
  
  // Maintenance
  getMaintenanceStatus: () => adminApi.get('/maintenance/status'),
  toggleMaintenance: (data) => adminApi.post('/admin/maintenance/toggle', data),
};