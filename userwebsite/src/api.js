import axios from 'axios';

const BASE = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');

const api = axios.create({ baseURL: BASE });

export const getCategories  = ()          => api.get('/api/category-images');
export const getBusinesses  = (params)    => api.get('/api/public/businesses', { params });
export const getBusiness    = (id)        => api.get(`/api/public/businesses/${id}`);
export const getDistricts   = ()          => api.get('/public/districts');
export const postReview     = (bizId, data) => api.post(`/api/public/businesses/${bizId}/review`, data);

export const REGISTER_URL = (phone = '') =>
  `${BASE}/public/register${phone ? `?phone=${encodeURIComponent(phone)}` : ''}`;

/* localStorage helpers */
export const LS_PHONE    = 'vanigan_phone';
export const LS_REVIEWED = 'vanigan_reviewed';          // JSON array of bizIds

export const getStoredPhone = () => localStorage.getItem(LS_PHONE) || '';
export const setStoredPhone = (p) => { if (p) localStorage.setItem(LS_PHONE, p); };
export const getReviewed    = () => { try { return JSON.parse(localStorage.getItem(LS_REVIEWED) || '[]'); } catch { return []; } };
export const markReviewed   = (bizId) => {
  const arr = getReviewed();
  if (!arr.includes(bizId)) { arr.push(bizId); localStorage.setItem(LS_REVIEWED, JSON.stringify(arr)); }
};

export default api;
