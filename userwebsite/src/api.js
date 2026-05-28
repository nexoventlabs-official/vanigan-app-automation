import axios from 'axios';

const BASE = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');

const api = axios.create({ baseURL: BASE });

export const getCategories  = ()          => api.get('/api/category-images');
export const getBusinesses  = (params)    => api.get('/api/public/businesses', { params });
export const getBusiness    = (id)        => api.get(`/api/public/businesses/${id}`);
export const getDistricts   = ()          => api.get('/public/districts');

export const REGISTER_URL = (phone = '') =>
  `${BASE}/public/register${phone ? `?phone=${encodeURIComponent(phone)}` : ''}`;

export default api;
