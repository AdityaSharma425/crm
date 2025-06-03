import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login page if unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const auth = {
  login: () => window.location.href = process.env.NEXT_PUBLIC_BACKEND_URL + '/api/auth/google',
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

// Customer API calls
export const customers = {
  getAll: () => api.get('/customers'),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
  recordTransaction: (id: string, amount: number) => api.post(`/customers/${id}/transactions`, { amount }),
};

// Segment API calls
export const segments = {
  getAll: () => api.get('/segments'),
  getById: (id: string) => api.get(`/segments/${id}`),
  create: (data: any) => api.post('/segments', data),
  update: (id: string, data: any) => api.put(`/segments/${id}`, data),
  delete: (id: string) => api.delete(`/segments/${id}`),
  preview: (data: any) => api.post('/segments/preview', data),
  convertToRules: (description: string) => api.post('/segments/convert-rules', { description }),
};

// Campaign API calls
export const campaigns = {
  getAll: () => api.get('/campaigns'),
  getById: (id: string) => api.get(`/campaigns/${id}`),
  create: (data: any) => api.post('/campaigns', data),
  update: (id: string, data: any) => api.put(`/campaigns/${id}`, data),
  delete: (id: string) => api.delete(`/campaigns/${id}`),
  getCustomers: (id: string) => api.get(`/campaigns/${id}/customers`),
  getAnalytics: (id: string) => api.get(`/campaigns/${id}/analytics`),
  activate: (id: string) => api.post(`/campaigns/${id}/activate`),
  stop: (id: string) => api.post(`/campaigns/${id}/stop`),
  suggestMessages: (data: { campaignObjective: string; audienceDescription: string }) => 
    api.post('/campaigns/suggest-messages', data),
};

// Dashboard API calls
export const dashboard = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: () => api.get('/dashboard/activity'),
};

export default api; 