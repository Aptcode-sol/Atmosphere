import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const login = (credentials) => api.post('/admin/login', credentials);

// Stats
export const getStats = () => api.get('/admin/stats');

// Users
export const getUsers = (params) => api.get('/admin/users', { params });
export const getUserById = (id) => api.get(`/admin/users/${id}`);
export const blockUser = (id, reason) => api.post(`/admin/block-user/${id}`, { reason });
export const unblockUser = (id) => api.post(`/admin/unblock-user/${id}`);

// Pending Startups
export const getPendingStartups = () => api.get('/admin/pending-startups');
export const verifyStartup = (id, notes) => api.post(`/admin/verify-startup/${id}`, { notes });
export const rejectStartup = (id, reason) => api.post(`/admin/reject-startup/${id}`, { reason });

// Grants
export const getGrants = () => api.get('/grants');
export const createGrant = (data) => api.post('/grants', data);
export const updateGrant = (id, data) => api.put(`/grants/${id}`, data);
export const deleteGrant = (id) => api.delete(`/grants/${id}`);

// Events
export const getEvents = () => api.get('/events');
export const createEvent = (data) => api.post('/events', data);
export const updateEvent = (id, data) => api.put(`/events/${id}`, data);
export const deleteEvent = (id) => api.delete(`/events/${id}`);

// Holdings
export const getHoldings = () => api.get('/admin/holdings');
export const getPendingHoldings = () => api.get('/admin/pending-holdings');
export const approveHolding = (investorId, investmentIndex) =>
    api.post(`/admin/approve-holding/${investorId}/${investmentIndex}`);
export const rejectHolding = (investorId, investmentIndex, reason) =>
    api.post(`/admin/reject-holding/${investorId}/${investmentIndex}`, { reason });

export default api;
