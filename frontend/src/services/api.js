import axios from 'axios';
import config from '../config/env';

// Create axios instance with default config
const api = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error);
      return Promise.reject(new Error('Request timeout. Please try again.'));
    }

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response error:', error.response.data);
      
      if (error.response.status === 401) {
        // Handle unauthorized access
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      return Promise.reject(new Error('No response from server. Please check your connection.'));
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
      return Promise.reject(error);
    }
  }
);

// API methods
export const authAPI = {
  login: (credentials) => api.post(config.endpoints.auth.login, credentials),
  register: (userData) => api.post(config.endpoints.auth.register, userData),
  googleLogin: () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${config.apiUrl}${config.endpoints.auth.google}`;
  },
  handleGoogleCallback: (code) => api.get(`${config.endpoints.auth.googleCallback}?code=${code}`),
  logout: () => api.post(config.endpoints.auth.logout)
};

export const customersAPI = {
  getAll: () => api.get(config.endpoints.customers),
  getById: (id) => api.get(`${config.endpoints.customers}/${id}`),
  create: (data) => api.post(config.endpoints.customers, data),
  update: (id, data) => api.put(`${config.endpoints.customers}/${id}`, data),
  delete: (id) => api.delete(`${config.endpoints.customers}/${id}`)
};

export const campaignsAPI = {
  getAll: () => api.get(config.endpoints.campaigns),
  getById: (id) => api.get(`${config.endpoints.campaigns}/${id}`),
  create: (data) => api.post(config.endpoints.campaigns, data),
  update: (id, data) => api.put(`${config.endpoints.campaigns}/${id}`, data),
  delete: (id) => api.delete(`${config.endpoints.campaigns}/${id}`)
};

export const segmentsAPI = {
  getAll: () => api.get(config.endpoints.segments),
  getById: (id) => api.get(`${config.endpoints.segments}/${id}`),
  create: (data) => api.post(config.endpoints.segments, data),
  update: (id, data) => api.put(`${config.endpoints.segments}/${id}`, data),
  delete: (id) => api.delete(`${config.endpoints.segments}/${id}`)
};

export const dashboardAPI = {
  getStats: () => api.get(config.endpoints.dashboard),
  getRecentActivity: () => api.get(`${config.endpoints.dashboard}/activity`)
};

export default api; 