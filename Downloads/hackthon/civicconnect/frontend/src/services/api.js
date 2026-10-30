import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000
});

// Attach auth token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cc_token');
      localStorage.removeItem('cc_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// AUTH
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  getNotifications: () => api.get('/auth/notifications')
};

// CITIZEN
export const citizenAPI = {
  getDashboard: () => api.get('/citizen/dashboard'),
  getComplaints: () => api.get('/citizen/complaints'),
  getNotifications: () => api.get('/auth/notifications'),
  markNotificationRead: (id) => api.put(`/notifications/${id}/read`)
};

// COMPLAINTS
export const complaintAPI = {
  submit: (formData) => api.post('/complaints', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getById: (id) => api.get(`/complaints/${id}`),
  trackByNumber: (number) => api.get(`/complaints/track/${encodeURIComponent(number)}`)
};

// ADMIN
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getComplaints: (params) => api.get('/admin/complaints', { params }),
  getComplaint: (id) => api.get(`/admin/complaints/${id}`),
  updateStatus: (id, data) => api.put(`/admin/complaints/${id}/status`, data),
  assignComplaint: (id, data) => api.put(`/admin/complaints/${id}/assign`, data),
  updatePriority: (id, data) => api.put(`/admin/complaints/${id}/priority`, data),
  getDepartments: () => api.get('/admin/departments'),
  createDepartment: (data) => api.post('/admin/departments', data),
  updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),
  getNotifications: () => api.get('/admin/notifications'),
  getUnreadCount: () => api.get('/admin/notifications/unread-count'),
  markAllRead: () => api.put('/admin/notifications/read-all'),
  markRead: (id) => api.put(`/notifications/${id}/read`)
};

// AI
export const aiAPI = {
  getInsights: () => api.get('/ai/insights'),
  getHotspots: (params) => api.get('/ai/hotspots', { params })
};

export default api;
