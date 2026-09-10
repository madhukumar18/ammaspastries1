import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach bearer token for customer or admin
api.interceptors.request.use(
  (config) => {
    // Check if request is for admin endpoints
    if (config.url && config.url.includes('/admin')) {
      const adminToken = localStorage.getItem('ammas_admin_token');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else {
      const userToken = localStorage.getItem('ammas_user_token');
      if (userToken) {
        config.headers.Authorization = `Bearer ${userToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for friendly error formatting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with non-2xx status
      const message = error.response.data?.message || 'Something went wrong. Please try again.';
      return Promise.reject({ ...error, friendlyMessage: message });
    } else if (error.request) {
      return Promise.reject({
        ...error,
        friendlyMessage: 'Unable to connect to the bakery server. Please check your connection.',
      });
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
