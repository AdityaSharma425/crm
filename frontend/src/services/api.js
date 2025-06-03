import axios from 'axios';
import config from '../config/env';

// Create axios instance with default config
const api = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
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
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: (credentials) => api.post(config.endpoints.auth.login, credentials),
  register: (userData) => api.post(config.endpoints.auth.register, userData),
  googleLogin: () => api.get(config.endpoints.auth.google),
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