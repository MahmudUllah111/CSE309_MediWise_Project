import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // Don't set Content-Type for FormData - browser will set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors (backend server not running)
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
      // Only log in development to avoid console spam
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Backend server is not running. Please start the backend server:');
        console.error('   cd backend && npm run dev');
      }
      error.message = 'Backend server is not running. Please start the server first.';
    }
    
    // Handle 401 unauthorized errors
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    // Handle 500 errors gracefully - log but don't spam console
    if (error.response?.status === 500) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Server error:', error.response?.data?.message || error.message);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

