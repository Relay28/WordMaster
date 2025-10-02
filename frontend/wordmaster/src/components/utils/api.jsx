// src/utils/api.js
import axios from 'axios';
import { useAuth } from '../context/AdminAuthContext';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});

// Add request interceptor
api.interceptors.request.use((config) => {
  const authData = JSON.parse(localStorage.getItem('adminAuth'));
  if (authData?.token) {
    config.headers.Authorization = `Bearer ${authData.token}`;
  }
  return config;
});

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { logout } = useAuth();
      logout();
    }
    return Promise.reject(error);
  }
);

export default api;