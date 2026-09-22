import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't log "logging out" or redirect if we're already on the login page
      // or if the request that failed WAS the login request
      const isLoginRequest = error.config.url.includes('/api/auth/login');
      const isLoginPage = window.location.pathname === '/login';

      if (!isLoginPage && !isLoginRequest) {
        console.warn('Unauthorized request, logging out...');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
