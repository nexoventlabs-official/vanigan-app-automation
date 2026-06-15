import axios from "axios";

const BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");

const api = axios.create({ baseURL: BASE });

export const getCategories = () => api.get("/api/category-images");
export const getGallery = () => api.get("/api/gallery");
export const getBusinesses = (params) =>
  api.get("/api/public/businesses", { params });
export const getBusiness = (id) => api.get(`/api/public/businesses/${id}`);
export const getDistricts = () => api.get("/public/districts");
export const postReview = (bizId, data) =>
  api.post(`/api/public/businesses/${bizId}/review`, data);

/* ── Owner PIN APIs ── */
export const checkOwnerPhone = (ownerPhone) =>
  api.post("/api/public/owner/check-phone", { ownerPhone });
export const setOwnerPin = (ownerPhone, pin) =>
  api.post("/api/public/owner/set-pin", { ownerPhone, pin });
export const verifyOwnerPin = (ownerPhone, pin) =>
  api.post("/api/public/owner/verify-pin", { ownerPhone, pin });
export const updateOwnerBusiness = (bizId, formData) =>
  api.put(`/api/public/owner/update/${bizId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

/* ── Website Auth APIs ── */
export const webSignup = (data) => api.post("/api/web-auth/signup", data);
export const webLogin = (phone, pin) =>
  api.post("/api/web-auth/login", { phone, pin });
export const webGetMe = (phone) =>
  api.get("/api/web-auth/me", { params: { phone } });
export const webCheckPhone = (phone) =>
  api.get("/api/web-auth/check-phone", { params: { phone } });
export const webLinkBusiness = (phone, businessId) =>
  api.post("/api/web-auth/link-business", { phone, businessId });

/* ── Member Auth APIs (new signup with EPIC + OTP + card) ── */
export const memberCheckPhone = (phone) =>
  api.get("/api/member-auth/check-phone", { params: { phone } });
export const memberLookupEpic = (epic) =>
  api.post("/api/member-auth/lookup-epic", { epic });
export const memberSendOtp = (phone) =>
  api.post("/api/member-auth/send-otp", { phone });
export const memberVerifyOtp = (phone, otp) =>
  api.post("/api/member-auth/verify-otp", { phone, otp });
export const memberUploadPhoto = (formData) =>
  api.post("/api/member-auth/upload-photo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const memberSignup = (data) => api.post("/api/member-auth/signup", data);
export const memberLogin = (phone, pin) =>
  api.post("/api/member-auth/login", { phone, pin });
export const memberGetMe = (phone) =>
  api.get("/api/member-auth/me", { params: { phone } });
export const memberLinkBusiness = (phone, businessId) =>
  api.post("/api/member-auth/link-business", { phone, businessId });
export const memberLinkEpic = (phone, epic) =>
  api.post("/api/member-auth/link-epic", { phone, epic });
export const memberGetReferralInfo = (phone) =>
  api.get("/api/member-auth/referral-info", { params: { phone } });
export const memberVerifyCard = (membershipId, pin) =>
  api.post("/api/member-auth/verify-card", { membershipId, pin });

/* ── Social — Follow / Save ── */
export const toggleFollow = (phone, businessId) =>
  api.post("/api/social/follow", { phone, businessId });
export const toggleSave = (phone, businessId) =>
  api.post("/api/social/save", { phone, businessId });
export const getSocialProfile = (phone) =>
  api.get("/api/social/profile", { params: { phone } });
export const getBizByPhone = (phone) =>
  api.get("/api/social/biz-by-phone", { params: { phone } });

/* ── Public business register URL ── */
export const REGISTER_URL = (phone = "", opts = {}) => {
  const base = BASE.replace(/\/+$/, "");
  const params = new URLSearchParams();
  // Always coerce to string to prevent "trim is not a function" if opts values are objects
  const s = (v) =>
    (v != null && typeof v === "string" ? v : String(v || "")).trim();
  if (phone) params.set("phone", s(phone));
  if (opts.bizName) params.set("bizName", s(opts.bizName));
  if (opts.category) params.set("category", s(opts.category));
  if (opts.subCategory) params.set("subCategory", s(opts.subCategory));
  if (opts.district) params.set("district", s(opts.district));
  if (opts.assembly) params.set("assembly", s(opts.assembly));
  if (opts.ownerName) params.set("ownerName", s(opts.ownerName));
  const qs = params.toString();
  return `${base}/public/register${qs ? `?${qs}` : ""}`;
};

/* ── localStorage ── */
export const LS_PHONE = "vanigan_phone";
export const LS_REVIEWED = "vanigan_reviewed"; // JSON array of bizIds
export const LS_AUTH = "vanigan_auth"; // { user, business } after login
export const LS_MEMBER = "vanigan_member_auth"; // { member, business } after member login

export const getStoredPhone = () => localStorage.getItem(LS_PHONE) || "";
export const setStoredPhone = (p) => {
  if (p) localStorage.setItem(LS_PHONE, p);
};
export const getReviewed = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_REVIEWED) || "[]");
  } catch {
    return [];
  }
};
export const markReviewed = (bizId) => {
  const arr = getReviewed();
  if (!arr.includes(bizId)) {
    arr.push(bizId);
    localStorage.setItem(LS_REVIEWED, JSON.stringify(arr));
  }
};

export const getAuthSession = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_AUTH) || "null");
  } catch {
    return null;
  }
};
export const setAuthSession = (data) => {
  if (data) localStorage.setItem(LS_AUTH, JSON.stringify(data));
  else localStorage.removeItem(LS_AUTH);
};

export const getMemberSession = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_MEMBER) || "null");
  } catch {
    return null;
  }
};
export const setMemberSession = (data) => {
  if (data) localStorage.setItem(LS_MEMBER, JSON.stringify(data));
  else localStorage.removeItem(LS_MEMBER);
};

export default api;
