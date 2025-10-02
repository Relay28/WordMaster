// src/utils/api.js
import axios from 'axios';

const api = axios.create({
  //baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080', if magka error sa front end change to this
  baseURL: import.meta.env.VITE_API_URL || 'http://3.26.165.228:8080', // EC2 instance IP address 
});

// Request interceptor
api.interceptors.request.use((config) => {
  const authData = JSON.parse(localStorage.getItem('adminAuth'));
  if (authData?.token) {
    config.headers.Authorization = `Bearer ${authData.token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      const { logout } = require('../context/AuthContext').useAuth();
      logout();
    }
    return Promise.reject(error);
  }
);

export default api;