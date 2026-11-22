import { api } from './api';

/** Endpoints du Super Dashboard Admin (gateway :8080, role admin vérifié côté backend). */
export const adminApi = {
  users: (params) => api.get('/admin/users', { params }),
  createUser: (payload) => api.post('/admin/users', payload),
  updateUser: (id, payload) => api.put(`/admin/users/${id}`, payload),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  resetPassword: (id) => api.post(`/admin/users/${id}/reset-password`),
  profile: () => api.get('/admin/profile'),
  updateProfile: (payload) => api.patch('/admin/profile', payload),
  audit: (params) => api.get('/admin/audit', { params }),
  maintenance: () => api.get('/admin/maintenance'),
  setMaintenance: (payload) => api.post('/admin/maintenance', payload),
  offres: () => api.get('/admin/offres'),
  createOffre: (payload) => api.post('/admin/offres', payload),
  updateOffre: (id, payload) => api.put(`/admin/offres/${id}`, payload),
  deleteOffre: (id) => api.delete(`/admin/offres/${id}`),
  boutiques: (params) => api.get('/admin/catalog/boutiques', { params }),
  createBoutique: (payload) => api.post('/admin/catalog/boutiques', payload),
  updateBoutique: (id, payload) => api.put(`/admin/catalog/boutiques/${id}`, payload),
  deleteBoutique: (id) => api.delete(`/admin/catalog/boutiques/${id}`),
  finances: () => api.get('/admin/catalog/boutiques/finances'),
  campaigns: (params) => api.get('/admin/campaigns', { params }),
  estimateCampaign: (payload) => api.post('/admin/campaigns/estimate', payload),
  broadcast: (payload) => api.post('/admin/campaigns', payload),
};
