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
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// ─── Customers ─────────────────────────────────────────────────────────────
export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  // Measurement profiles
  addProfile: (id, data) => api.post(`/customers/${id}/measurements`, data),
  updateProfile: (id, profileId, data) => api.put(`/customers/${id}/measurements/${profileId}`, data),
  deleteProfile: (id, profileId) => api.delete(`/customers/${id}/measurements/${profileId}`),
};

// ─── Orders ────────────────────────────────────────────────────────────────
export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  delete: (id) => api.delete(`/orders/${id}`),
  getStats: () => api.get('/orders/stats'),
  getDeadlines: () => api.get('/orders/deadlines'),
  getChartData: (params) => api.get('/orders/chart-data', { params }),
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

// ─── Suppliers ────────────────────────────────────────────────────────────
export const supplierAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

// ─── Products / Inventory ─────────────────────────────────────────────────
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// ─── Purchases ────────────────────────────────────────────────────────────
export const purchaseAPI = {
  getAll: (params) => api.get('/purchases', { params }),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  delete: (id) => api.delete(`/purchases/${id}`),
  recordPayment: (id, data) => api.post(`/purchases/${id}/payment`, data),
  getStats: () => api.get('/purchases/stats'),
  getBusinessChart: (params) => api.get('/purchases/business-chart', { params }),
};

// ─── Sales ────────────────────────────────────────────────────────────────
export const saleAPI = {
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  delete: (id) => api.delete(`/sales/${id}`),
  recordPayment: (id, data) => api.post(`/sales/${id}/payment`, data),
  getStats: () => api.get('/sales/stats'),
};

// ─── Tenants (superadmin + agent) ─────────────────────────────────────────
export const tenantAPI = {
  getAll: (params) => api.get('/tenants', { params }),
  getById: (id) => api.get(`/tenants/${id}`),
  create: (data) => api.post('/tenants', data),
  update: (id, data) => api.put(`/tenants/${id}`, data),
  delete: (id) => api.delete(`/tenants/${id}`),
  toggleStatus: (id, isActive) => api.patch(`/tenants/${id}/status`, { isActive }),
  resetPassword: (id) => api.post(`/tenants/${id}/reset-password`),
  getMessagingUsage: (id, params) => api.get(`/tenants/${id}/messaging-usage`, { params }),
  resetWhatsAppUsage: (id) => api.post(`/tenants/${id}/reset-whatsapp-usage`),
};

// ─── Agents (superadmin only) ─────────────────────────────────────────────
export const agentAPI = {
  getAll: (params) => api.get('/agents', { params }),
  getById: (id) => api.get(`/agents/${id}`),
  create: (data) => api.post('/agents', data),
  update: (id, data) => api.put(`/agents/${id}`, data),
  delete: (id) => api.delete(`/agents/${id}`),
  toggleStatus: (id, isActive) => api.patch(`/agents/${id}/status`, { isActive }),
  resetPassword: (id) => api.post(`/agents/${id}/reset-password`),
};

// ─── Public Tracking ───────────────────────────────────────────────────────
export const trackingAPI = {
  getInfo: (trackingId) => api.get(`/track/${trackingId}`),
};

export default api;
