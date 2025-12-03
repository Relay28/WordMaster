// src/utils/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});

// Add request interceptor
api.interceptors.request.use((config) => {
  const authData = localStorage.getItem('adminAuth');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      if (parsed?.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    } catch (e) {
      console.error('Failed to parse admin auth token', e);
    }
  }
  return config;
});

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear admin auth and redirect to login
      localStorage.removeItem('adminAuth');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;