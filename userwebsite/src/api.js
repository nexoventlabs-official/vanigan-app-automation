import axios from 'axios';

const BASE = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');

const api = axios.create({ baseURL: BASE });

export const getCategories  = ()          => api.get('/api/category-images');
export const getBusinesses  = (params)    => api.get('/api/public/businesses', { params });
export const getBusiness    = (id)        => api.get(`/api/public/businesses/${id}`);
export const getDistricts   = ()          => api.get('/public/districts');
export const postReview     = (bizId, data) => api.post(`/api/public/businesses/${bizId}/review`, data);

/* ── Owner PIN APIs ── */
export const checkOwnerPhone = (ownerPhone) =>
  api.post('/api/public/owner/check-phone', { ownerPhone });
export const setOwnerPin = (ownerPhone, pin) =>
  api.post('/api/public/owner/set-pin', { ownerPhone, pin });
export const verifyOwnerPin = (ownerPhone, pin) =>
  api.post('/api/public/owner/verify-pin', { ownerPhone, pin });
export const updateOwnerBusiness = (bizId, formData) =>
  api.put(`/api/public/owner/update/${bizId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

/* ── Website Auth APIs ── */
export const webSignup = (data) => api.post('/api/web-auth/signup', data);
export const webLogin  = (phone, pin) => api.post('/api/web-auth/login', { phone, pin });
export const webGetMe  = (phone) => api.get('/api/web-auth/me', { params: { phone } });
export const webCheckPhone = (phone) => api.get('/api/web-auth/check-phone', { params: { phone } });
export const webLinkBusiness = (phone, businessId) =>
  api.post('/api/web-auth/link-business', { phone, businessId });

/* ── Public business register URL ── */
export const REGISTER_URL = (phone = '', opts = {}) => {
  const base = BASE.replace(/\/+$/, '');
  const params = new URLSearchParams();
  if (phone) params.set('phone', phone);
  if (opts.category)    params.set('category', opts.category);
  if (opts.subCategory) params.set('subCategory', opts.subCategory);
  if (opts.district)    params.set('district', opts.district);
  if (opts.assembly)    params.set('assembly', opts.assembly);
  const qs = params.toString();
  return `${base}/public/register${qs ? `?${qs}` : ''}`;
};

/* ── localStorage ── */
export const LS_PHONE    = 'vanigan_phone';
export const LS_REVIEWED = 'vanigan_reviewed';          // JSON array of bizIds
export const LS_AUTH     = 'vanigan_auth';              // { user, business } after login

export const getStoredPhone = () => localStorage.getItem(LS_PHONE) || '';
export const setStoredPhone = (p) => { if (p) localStorage.setItem(LS_PHONE, p); };
export const getReviewed    = () => { try { return JSON.parse(localStorage.getItem(LS_REVIEWED) || '[]'); } catch { return []; } };
export const markReviewed   = (bizId) => {
  const arr = getReviewed();
  if (!arr.includes(bizId)) { arr.push(bizId); localStorage.setItem(LS_REVIEWED, JSON.stringify(arr)); }
};

export const getAuthSession = () => {
  try { return JSON.parse(localStorage.getItem(LS_AUTH) || 'null'); } catch { return null; }
};
export const setAuthSession = (data) => {
  if (data) localStorage.setItem(LS_AUTH, JSON.stringify(data));
  else localStorage.removeItem(LS_AUTH);
};

export default api;
