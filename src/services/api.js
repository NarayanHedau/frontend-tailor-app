import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const auth = JSON.parse(localStorage.getItem('tailor-auth') || '{}');
    const token = auth?.state?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tailor-auth');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ─── Customers ─────────────────────────────────────────────────────────────
export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// ─── Orders ────────────────────────────────────────────────────────────────
export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  delete: (id) => api.delete(`/orders/${id}`),
  getStats: () => api.get('/orders/stats'),
  updateItemStatus: (orderId, itemId, status) =>
    api.put(`/orders/${orderId}/items/${itemId}/status`, { status }),
  updateMeasurements: (orderId, itemId, data) =>
    api.put(`/orders/${orderId}/items/${itemId}/measurements`, data),
  uploadItemImage: (orderId, itemId, formData) =>
    api.post(`/orders/${orderId}/items/${itemId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ─── Invoices ──────────────────────────────────────────────────────────────
export const invoiceAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getByOrder: (orderId) => api.get(`/invoices/order/${orderId}`),
  create: (data) => api.post('/invoices', data),
  recordPayment: (id, data) => api.post(`/invoices/${id}/payment`, data),
};

// ─── Public Tracking ───────────────────────────────────────────────────────
export const trackingAPI = {
  getInfo: (trackingId) => api.get(`/track/${trackingId}`),
};

export default api;
