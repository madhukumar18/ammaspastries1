import axios from 'axios';

// On external/tunnel hostnames, always use relative '/api' to proxy through Vite.
// Even on localhost, relative '/api' is preferred because Vite proxies it to port 8000.
const isRemoteHost =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1';

let API_BASE_URL = '/api';
if (!isRemoteHost) {
  API_BASE_URL =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    '/api';
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to attach bearer token for customer or admin
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined' && window.localStorage) {
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
