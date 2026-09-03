import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://vexastore-backend.onrender.com';
const getToken = () => localStorage.getItem('vexastore_admin_token');

export const adminApi = axios.create({ baseURL: API_BASE_URL, timeout: 30000, headers: { 'Content-Type': 'application/json' } });
adminApi.interceptors.request.use((config) => { const token = getToken(); if (token) config.headers.Authorization = `Bearer ${token}`; return config; }, (error) => Promise.reject(error));
adminApi.interceptors.response.use((response) => response, (error) => { if (error.response?.status === 401) { localStorage.removeItem('vexastore_admin_token'); window.location.href = '/'; } const message = error.response?.data?.message || error.message || 'Something went wrong'; return Promise.reject({ ...error, userMessage: message }); });
export const getApiErrorMessage = (err) => err?.userMessage || err?.response?.data?.message || err?.message || 'Network error';

export const api = {
  adminLogin: (data) => adminApi.post('/api/admin/login', data),
  verifyToken: () => adminApi.get('/api/admin/verify'),
  getApps: (params) => adminApi.get('/api/admin/apps', { params }),
  getApp: (id) => adminApi.get(`/api/admin/apps/${id}`),
  createApp: (data) => data instanceof FormData ? adminApi.post('/api/admin/apps', data, { headers: { 'Content-Type': 'multipart/form-data' } }) : adminApi.post('/api/admin/apps', data),
  updateApp: (id, data) => data instanceof FormData ? adminApi.put(`/api/admin/apps/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }) : adminApi.put(`/api/admin/apps/${id}`, data),
  deleteApp: (id) => adminApi.delete(`/api/admin/apps/${id}`),

  addVersion: (data) => data instanceof FormData ? adminApi.post('/api/admin/versions', data, { headers: { 'Content-Type': 'multipart/form-data' } }) : adminApi.post('/api/admin/versions', data),
  addReleaseVersion: (data) => adminApi.post('/api/admin/release-versions', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateReleaseVersion: (id, data) => adminApi.put(`/api/admin/release-versions/${id}`, data),
  deleteVersion: (id) => adminApi.delete(`/api/admin/versions/${id}`),

  getCategories: () => adminApi.get('/api/categories'),
  getAdminCategories: () => adminApi.get('/api/admin/categories'),
  createCategory: (data) => adminApi.post('/api/admin/categories', data),
  updateCategory: (id, data) => adminApi.put(`/api/admin/categories/${id}`, data),
  deleteCategory: (id) => adminApi.delete(`/api/admin/categories/${id}`),
  getNews: () => adminApi.get('/api/admin/news'),
  createNews: (data) => data instanceof FormData ? adminApi.post('/api/admin/news', data, { headers: { 'Content-Type': 'multipart/form-data' } }) : adminApi.post('/api/admin/news', data),
  updateNews: (id, data) => data instanceof FormData ? adminApi.put(`/api/admin/news/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }) : adminApi.put(`/api/admin/news/${id}`, data),
  deleteNews: (id) => adminApi.delete(`/api/admin/news/${id}`),
  getUsers: (params) => adminApi.get('/api/admin/users', { params }),
  updateUser: (id, data) => adminApi.put(`/api/admin/users/${id}`, data),
  deleteUser: (id) => adminApi.delete(`/api/admin/users/${id}`),
  getSettings: () => adminApi.get('/api/admin/settings'),
  updateSettings: (data) => adminApi.put('/api/admin/settings', data),
  uploadLogo: (file) => { const formData = new FormData(); formData.append('logo', file); return adminApi.post('/api/admin/settings/upload-logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  uploadFavicon: (file) => { const formData = new FormData(); formData.append('favicon', file); return adminApi.post('/api/admin/settings/upload-favicon', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  getDownloadStats: (period) => adminApi.get(`/api/downloads/stats?period=${period || '30d'}`),
  getMaintenanceStatus: () => adminApi.get('/api/maintenance/status'),
  toggleMaintenance: (data) => adminApi.post('/api/admin/maintenance/toggle', data),
};

export default api;
