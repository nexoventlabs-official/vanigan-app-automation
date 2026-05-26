/**
 * Public business directory — mobile-friendly HTML pages.
 *
 * GET  /public/dir?district=X&assembly=Y&category=Z  — filtered business list
 * GET  /public/dir/:id                               — business detail + reviews
 * POST /public/dir/:id/review                        — submit review
 */
const express = require('express');
const Business = require('../models/Business');
const Review   = require('../models/Review');

const router = express.Router();

/* ── helpers ── */
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── SVG icon helpers ── */
const IC = {
  mapPin:   '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  landmark: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  city:     '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v5"/><path d="M3 21h18"/><path d="M3 7l9-4 9 4"/><path d="M3 7v14"/><path d="M21 7v14"/></svg>',
  gps:      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>',
  phone:    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.67 9.78 19.79 19.79 0 0 1 1.61 1.16 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  whatsapp: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>',
  mail:     '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  globe:    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  clock:    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  mobile:   '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  help:     '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  tag:      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  search:   '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#66ff4c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  store:    '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#66ff4c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
};

const SOCIAL_PLATFORMS = [
  { id:'fbLink',      label:'Facebook',     bg:'#e7f0fd', border:'#1877F244', color:'#1877F2', icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' },
  { id:'twitterLink', label:'Twitter / X',  bg:'#f0f0f0', border:'#00000022', color:'#000000', icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="#000"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' },
  { id:'instaLink',   label:'Instagram',    bg:'#fce4f1', border:'#C1358444', color:'#C13584', icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="#C13584"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>' },
  { id:'googleMap',   label:'Google Maps',  bg:'#e8f0fe', border:'#1A73E844', color:'#1A73E8', icon:'<svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M12 2C8.13 2 5 5.13 5 9c0 1.7.52 3.28 1.41 4.58L12 22l5.59-8.42A6.96 6.96 0 0 0 19 9c0-3.87-3.13-7-7-7z"/><path fill="#34A853" d="M12 22l5.59-8.42A6.96 6.96 0 0 1 12 9v13z"/><path fill="#FBBC04" d="M5 9c0 1.7.52 3.28 1.41 4.58L12 22V9H5z"/><circle fill="white" cx="12" cy="9" r="2.8"/></svg>' },
  { id:'videoUrl',    label:'YouTube',      bg:'#ffe8e8', border:'#FF000044', color:'#FF0000', icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>' },
];

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color:#030712;
  background-image:radial-gradient(rgba(102,255,76,0.04) 1.5px, transparent 1.5px);
  background-size:24px 24px;
  min-height:100vh;
  color:#ffffff;
  position:relative;
  overflow-x:hidden;
}
body::before {
  content:"";
  position:absolute;
  top:0;
  left:50%;
  transform:translateX(-50%);
  width:100%;
  max-width:600px;
  height:250px;
  background:radial-gradient(circle at top, rgba(102,255,76,0.07) 0%, transparent 70%);
  pointer-events:none;
  z-index:0;
}
.top-bar{
  background:rgba(10,14,23,0.85);
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  border-bottom:1px solid rgba(102,255,76,0.15);
  color:#ffffff;
  padding:14px 16px;
  display:flex;
  align-items:center;
  gap:12px;
  position:sticky;
  top:0;
  z-index:10;
}
.top-bar a{color:#66ff4c;text-decoration:none;font-size:.85rem;font-weight:700;transition:all 0.2s}
.top-bar a:hover{text-shadow:0 0 8px rgba(102,255,76,0.5)}
.top-bar h1{font-size:1.1rem;font-weight:900;letter-spacing:-0.01em;flex:1}
.top-bar p{font-size:.75rem;color:#9ca3af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;font-weight:600}
.wrap{max-width:600px;margin:0 auto;padding:16px;position:relative;z-index:1}
.chip{
  display:inline-flex;
  align-items:center;
  background:rgba(102,255,76,0.06);
  color:#66ff4c;
  border-radius:20px;
  padding:5px 12px;
  font-size:.7rem;
  font-weight:800;
  margin-right:6px;
  margin-bottom:8px;
  border:1px solid rgba(102,255,76,0.2);
  text-transform:uppercase;
  letter-spacing:0.04em;
  box-shadow:0 0 10px rgba(102,255,76,0.04);
}
.biz-card{
  background:#0A0E17;
  border-radius:16px;
  margin-bottom:16px;
  overflow:hidden;
  display:flex;
  flex-direction:column;
  border:1px solid rgba(255,255,255,0.06);
  box-shadow:0 4px 20px rgba(0,0,0,0.4);
  transition:all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position:relative;
  z-index:1;
}
.biz-card:hover{
  border-color:rgba(102,255,76,0.25);
  transform:translateY(-2px);
  box-shadow:0 12px 30px rgba(102,255,76,0.05);
}
.biz-card-img{
  width:90px;
  height:90px;
  object-fit:cover;
  border-radius:10px;
  margin:14px 0 14px 14px;
  border:1px solid rgba(255,255,255,0.08);
}
.biz-card-no-img{
  width:90px;
  height:90px;
  background:rgba(255,255,255,0.02);
  border:1px solid rgba(255,255,255,0.06);
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:1.6rem;
  border-radius:10px;
  margin:14px 0 14px 14px;
  color:#66ff4c;
}
.biz-card-body{
  padding:14px 14px 14px 12px;
  flex:1;
  min-width:0;
  display:flex;
  flex-direction:column;
  justify-content:center;
}
.biz-name{
  font-size:1.05rem;
  font-weight:850;
  color:#ffffff;
  margin-bottom:4px;
  letter-spacing:-0.018em;
  display:flex;
  align-items:center;
  gap:6px;
}
.biz-cat{
  font-size:.7rem;
  color:#66ff4c;
  font-weight:750;
  margin-bottom:6px;
  text-transform:uppercase;
  letter-spacing:0.06em;
}
.biz-desc{font-size:.78rem;color:#9ca3af;margin-bottom:8px;line-height:1.45}
.biz-phone{font-size:.8rem;color:#d1d5db}
.biz-phone a{color:#66ff4c;text-decoration:none;font-weight:750;font-size:0.82rem;display:inline-flex;align-items:center;gap:4px}
.view-btn{
  display:block;
  text-align:center;
  background:rgba(102,255,76,0.02);
  color:#66ff4c;
  border-top:1px solid rgba(255,255,255,0.05);
  padding:12px;
  font-size:.82rem;
  font-weight:800;
  text-decoration:none;
  text-transform:uppercase;
  letter-spacing:0.08em;
  transition:all 0.25s;
}
.view-btn:hover{
  background:rgba(102,255,76,0.06);
  text-shadow:0 0 8px rgba(102,255,76,0.4);
}
.empty{text-align:center;padding:48px 16px;color:#6b7280}
.empty .icon{font-size:48px;margin-bottom:12px;filter:drop-shadow(0 0 8px rgba(102,255,76,0.15))}
/* detail */
.cover{width:100%;height:160px;object-fit:cover;border-radius:20px;margin-bottom:16px;border:1px solid rgba(255,255,255,0.08)}
.biz-title{
  font-size:1.45rem;
  font-weight:900;
  color:#ffffff;
  margin-bottom:6px;
  letter-spacing:-0.02em;
  display:flex;
  align-items:center;
  gap:8px;
}
.biz-sub{font-size:.82rem;color:#9ca3af;margin-bottom:16px;font-weight:500}
.section{
  background:#0A0E17;
  border-radius:18px;
  padding:20px;
  margin-bottom:16px;
  border:1px solid rgba(255,255,255,0.06);
  box-shadow:0 8px 24px rgba(0,0,0,0.4);
}
.sec-head{
  font-size:.72rem;
  font-weight:900;
  color:#66ff4c;
  text-transform:uppercase;
  letter-spacing:.1em;
  margin-bottom:14px;
  padding-bottom:8px;
  border-bottom:1px solid rgba(102,255,76,0.12);
}
.row-info{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.04);align-items:center}
.row-info:last-child{border-bottom:none}
.row-icon{font-size:1rem;width:24px;color:#9ca3af;flex-shrink:0;display:flex;justify-content:center;align-items:center}
.row-val{font-size:.88rem;color:#e5e7eb;word-break:break-word;line-height:1.45}
.row-val a{color:#66ff4c;text-decoration:none;font-weight:750;transition:all 0.2s}
.row-val a:hover{text-shadow:0 0 8px rgba(102,255,76,0.3)}
.svc-item{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
.svc-item:last-child{border-bottom:none}
.svc-img{width:56px;height:56px;object-fit:cover;border-radius:8px;border:1px solid rgba(255,255,255,0.08);flex-shrink:0}
.svc-name{font-weight:800;font-size:.88rem;color:#ffffff}
.svc-price{font-size:.82rem;color:#66ff4c;font-weight:800;margin-left:6px}
.svc-detail{font-size:.78rem;color:#9ca3af;margin-top:4px;line-height:1.45}
.gallery-grid{display:flex;flex-wrap:wrap;gap:8px}
.gallery-grid img{width:80px;height:80px;object-fit:cover;border-radius:12px;cursor:pointer;border:1px solid rgba(255,255,255,0.08);transition:all 0.2s}
.gallery-grid img:hover{transform:scale(1.05);border-color:#66ff4c}
.rev-item{padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
.rev-item:last-child{border-bottom:none}
.rev-stars{color:#f59e0b;font-size:.9rem}
.rev-name{font-weight:700;font-size:.82rem;color:#ffffff;margin-left:6px}
.rev-text{font-size:.82rem;color:#e5e7eb;margin-top:6px;line-height:1.45}
.avg-row{
  display:flex;
  align-items:center;
  gap:16px;
  margin-bottom:16px;
  background:rgba(255,255,255,0.02);
  border:1px solid rgba(255,255,255,0.04);
  padding:14px 18px;
  border-radius:12px;
}
.avg-num{font-size:2.4rem;font-weight:900;color:#ffffff;letter-spacing:-0.02em}
.avg-label{font-size:.8rem;color:#9ca3af;font-weight:600;margin-top:2px}
label{display:block;font-size:10px;font-weight:800;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;margin-top:8px}
input,textarea,select{
  width:100%;
  border:1px solid rgba(255,255,255,0.08);
  border-radius:10px;
  padding:12px 14px;
  font-size:.88rem;
  outline:none;
  background:rgba(0,0,0,0.5);
  color:#ffffff;
  margin-bottom:14px;
  transition:all .25s;
}
input:focus,textarea:focus,select:focus{
  border-color:#66ff4c;
  background:rgba(0,0,0,0.8);
  box-shadow:0 0 12px rgba(102,255,76,0.15);
}
select{
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2366ff4c' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
  background-position: right 0.75rem center;
  background-size: 1.25rem;
  background-repeat: no-repeat;
  padding-right: 2.5rem;
}
select option{
  background-color: #0A0E17;
  color: #ffffff;
}
textarea{resize:vertical}
.submit-btn{
  width:100%;
  background:#66ff4c;
  color:#000000;
  font-weight:850;
  padding:12px;
  border-radius:10px;
  border:none;
  font-size:.85rem;
  text-transform:uppercase;
  letter-spacing:0.05em;
  cursor:pointer;
  transition:all .2s;
  box-shadow:0 0 12px rgba(102,255,76,0.25);
}
.submit-btn:hover{background:#52e038;transform:translateY(-1px)}
.days-tag{
  display:inline-block;
  background:rgba(102,255,76,0.05);
  color:#66ff4c;
  border-radius:6px;
  padding:4px 10px;
  font-size:.7rem;
  font-weight:800;
  margin:3px;
  border:1px solid rgba(102,255,76,0.15);
  text-transform:uppercase;
  letter-spacing:0.02em;
}
.toast{background:rgba(102,255,76,0.1);border:1px solid rgba(102,255,76,0.3);color:#66ff4c;border-radius:12px;padding:12px 14px;font-size:.85rem;font-weight:600;margin-bottom:16px}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.anim-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
.soc-chip{
  display:inline-flex;
  align-items:center;
  gap:6px;
  padding:7px 13px;
  border-radius:20px;
  border:1px solid;
  font-size:.78rem;
  font-weight:700;
  text-decoration:none;
  transition:opacity 0.2s;
  margin:3px;
}
.soc-chip:hover{opacity:0.75}
`;

function shell(title, body, backUrl='') {
  const back = backUrl ? `<a href="${esc(backUrl)}">← Back</a>` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Vanigan</title>
<style>${CSS}</style>
</head>
<body>
<div class="top-bar">
  ${back}
  <div>
    <h1><img src="https://vanigan.org/front/images/home/tnvslogo.png" alt="Vanigan" style="height:28px;width:auto;vertical-align:middle;display:inline-block"></h1>
    ${title !== 'Vanigan' ? `<p>${esc(title)}</p>` : ''}
  </div>
</div>
${body}
</body>
</html>`;
}

function stars(n) {
  const full = Math.round(Math.min(5, Math.max(0, n)));
  let svgList = '';
  for (let i = 1; i <= 5; i++) {
    const isFilled = i <= full;
    svgList += `<svg class="star-icon" viewBox="0 0 20 20" fill="${isFilled ? '#f59e0b' : 'none'}" stroke="#f59e0b" stroke-width="1.5" style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:2px"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>`;
  }
  return svgList;
}

/* ── GET /public/dir — business list ── */
router.get('/', async (req, res) => {
  const { district = '', assembly = '', category = '' } = req.query;
  const filter = { active: true };
  if (district) filter.district = district;
  if (assembly) filter.assembly = assembly;
  if (category && category !== 'All') filter.category = category;

  const businesses = await Business.find(filter).sort({ name: 1 }).limit(100).lean().catch(() => []);

  const locLabel = [assembly, district].filter(Boolean).join(', ') || 'All Areas';
  const catLabel = (category && category !== 'All') ? category : 'All Categories';
  const pageTitle = `Businesses – ${locLabel}`;

  const { name: userName = '' } = req.query;
  const listQ = `?district=${encodeURIComponent(district)}&assembly=${encodeURIComponent(assembly)}&category=${encodeURIComponent(category)}${userName ? '&name=' + encodeURIComponent(userName) : ''}`;

  let cards = '';
  if (!businesses.length) {
    cards = `<div class="empty"><div style="margin-bottom:12px">${IC.search}</div><p>No businesses found for the selected filters.<br>Try changing the category or location.</p></div>`;
  } else {
    cards = businesses.map(b => {
      const imgTag = b.image
        ? `<img class="biz-card-img" src="${esc(b.image)}" alt="${esc(b.name)}" loading="lazy">`
        : `<div class="biz-card-no-img">${IC.store}</div>`;
      const phone = b.phone || b.whatsappNo || '';
      const phoneHtml = phone ? `<span class="biz-phone"><a href="tel:${esc(phone)}">${esc(phone)}</a></span>` : '';
      const desc = (b.description || b.address || '').substring(0, 80);
      const activeBadge = b.active
        ? `<svg viewBox="0 0 24 24" width="16" height="16" style="display:inline-block;vertical-align:middle;margin-left:4px;flex-shrink:0" fill="currentColor" title="Verified active business"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.941.1-1.358.275C14.77 2.515 13.498 1.5 12 1.5s-2.77 1.015-3.412 2.285c-.417-.175-.878-.275-1.358-.275-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .941-.1 1.358-.275.642 1.27 1.914 2.285 3.412 2.285s2.77-1.015 3.412-2.285c.417.175.878.275 1.358.275 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z" fill="#0095F6"/><path d="M9.78 16.72l-3.86-3.86 1.41-1.41 2.45 2.45 6.18-6.18 1.41 1.41-7.59 7.59z" fill="white"/></svg>`
        : '';
      return `<div class="biz-card">
  <div style="display:flex;align-items:stretch;width:100%">
    ${imgTag}
    <div class="biz-card-body">
      <div class="biz-name">${esc(b.name)}${activeBadge}</div>
      ${b.category ? `<div class="biz-cat">${esc(b.category)}</div>` : ''}
      ${desc ? `<div class="biz-desc">${esc(desc)}</div>` : ''}
      ${phoneHtml}
    </div>
  </div>
  <a class="view-btn" href="/public/dir/${esc(b._id.toString())}${listQ}">View Details →</a>
</div>`;
    }).join('');
  }

  const body = `<div class="wrap">
  <div style="margin-bottom:14px">
    <span class="chip">${IC.mapPin} ${esc(locLabel)}</span>
    <span class="chip">${IC.tag} ${esc(catLabel)}</span>
    <p style="font-size:.78rem;color:#9ca3af;margin-top:6px">${businesses.length} result${businesses.length !== 1 ? 's' : ''}</p>
  </div>
  ${cards}
</div>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(shell(pageTitle, body));
});

/* ── GET /public/dir/:id — business detail ── */
router.get('/:id', async (req, res) => {
  const { district = '', assembly = '', category = '', name: userName = '' } = req.query;
  const backUrl = `/public/dir?district=${encodeURIComponent(district)}&assembly=${encodeURIComponent(assembly)}&category=${encodeURIComponent(category)}${userName ? '&name=' + encodeURIComponent(userName) : ''}`;

  let biz;
  try { biz = await Business.findById(req.params.id).lean(); } catch { biz = null; }
  if (!biz) {
    return res.status(404).setHeader('Content-Type','text/html').send(
      shell('Not Found', `<div class="wrap"><div class="empty"><div class="icon">❌</div><p>Business not found.</p></div></div>`, backUrl)
    );
  }

  const reviews = await Review.find({ targetKind: 'business', targetId: req.params.id })
    .sort({ createdAt: -1 }).limit(20).lean().catch(() => []);
  const avgAgg = await Review.aggregate([
    { $match: { targetKind: 'business', targetId: req.params.id } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]).catch(() => []);
  const avg = avgAgg[0]?.avg || 0;
  const total = avgAgg[0]?.count || 0;

  const submitted = req.query.submitted === '1';

  /* cover image */
  const coverSrc = biz.coverImage || biz.image || '';
  const coverHtml = coverSrc ? `<img class="cover" src="${esc(coverSrc)}" alt="${esc(biz.name)}">` : '';

  /* contact section */
  const contactRows = [
    biz.phone      && [IC.phone,    `<a href="tel:${esc(biz.phone)}">${esc(biz.phone)}</a>`],
    biz.whatsappNo && [IC.whatsapp, `<a href="https://wa.me/${esc(biz.whatsappNo.replace(/\D/g,''))}" target="_blank">${esc(biz.whatsappNo)} (WhatsApp)</a>`],
    biz.landline   && [IC.phone,    esc(biz.landline)],
    biz.phone2     && [IC.mobile,   esc(biz.phone2)],
    biz.email      && [IC.mail,     `<a href="mailto:${esc(biz.email)}">${esc(biz.email)}</a>`],
    biz.website    && [IC.globe,    `<a href="${esc(biz.website)}" target="_blank">${esc(biz.website)}</a>`],
  ].filter(Boolean);

  const socialChips = SOCIAL_PLATFORMS
    .filter(p => biz[p.id])
    .map(p => `<a class="soc-chip" href="${esc(biz[p.id])}" target="_blank" rel="noreferrer" style="background:${p.bg};border-color:${p.border};color:${p.color}">${p.icon} ${p.label}</a>`)
    .join('');

  /* location section */
  const locRows = [
    biz.address          && [IC.mapPin,   esc(biz.address)],
    biz.landmark         && [IC.landmark, esc(biz.landmark)],
    (biz.city || biz.pincode) && [IC.city, esc([biz.city, biz.pincode].filter(Boolean).join(' – '))],
    biz.serviceLocations && [IC.mapPin,   `Serves: ${esc(biz.serviceLocations)}`],
    (biz.lat && biz.lng) && [IC.gps,      `<a href="https://maps.google.com/?q=${esc(biz.lat)},${esc(biz.lng)}" target="_blank">View on Map</a>`],
  ].filter(Boolean);

  /* hours */
  const daysHtml = biz.openDays
    ? biz.openDays.split(',').map(d => `<span class="days-tag">${esc(d.trim())}</span>`).join('')
    : '';
  const timeHtml = [biz.openTime, biz.closeTime].filter(Boolean).join(' – ');

  /* services */
  const validSvcs = (biz.services || []).filter(s => s.name);
  const svcsHtml = validSvcs.map(s => `
  <div class="svc-item">
    ${s.image ? `<img class="svc-img" src="${esc(s.image)}" alt="${esc(s.name)}" loading="lazy">` : ''}
    <div>
      <div class="svc-name">${esc(s.name)}${s.price ? ` <span class="svc-price">₹${esc(s.price)}</span>` : ''}</div>
      ${s.detail ? `<div class="svc-detail">${esc(s.detail)}</div>` : ''}
    </div>
  </div>`).join('');

  /* gallery */
  const galleryHtml = (biz.galleryImages || []).map(g =>
    `<img src="${esc(g.url)}" alt="gallery" loading="lazy">`
  ).join('');

  /* reviews */
  const revHtml = reviews.map(r => `
  <div class="rev-item">
    <span class="rev-stars">${stars(r.rating)}</span>
    <span class="rev-name">${esc(r.reviewerName || 'Anonymous')}</span>
    ${r.text ? `<div class="rev-text">${esc(r.text)}</div>` : ''}
  </div>`).join('');

  const listQ = `?district=${encodeURIComponent(district)}&assembly=${encodeURIComponent(assembly)}&category=${encodeURIComponent(category)}${userName ? '&name=' + encodeURIComponent(userName) : ''}`;

  const activeBadge = biz.active
    ? `<svg viewBox="0 0 24 24" width="20" height="20" style="display:inline-block;vertical-align:middle;margin-left:6px;flex-shrink:0" fill="currentColor" title="Verified active business"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.941.1-1.358.275C14.77 2.515 13.498 1.5 12 1.5s-2.77 1.015-3.412 2.285c-.417-.175-.878-.275-1.358-.275-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .941-.1 1.358-.275.642 1.27 1.914 2.285 3.412 2.285s2.77-1.015 3.412-2.285c.417.175.878.275 1.358.275 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z" fill="#0095F6"/><path d="M9.78 16.72l-3.86-3.86 1.41-1.41 2.45 2.45 6.18-6.18 1.41 1.41-7.59 7.59z" fill="white"/></svg>`
    : `<svg viewBox="0 0 24 24" width="20" height="20" style="display:inline-block;vertical-align:middle;margin-left:6px;flex-shrink:0" class="anim-pulse" fill="currentColor" title="Pending review"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.941.1-1.358.275C14.77 2.515 13.498 1.5 12 1.5s-2.77 1.015-3.412 2.285c-.417-.175-.878-.275-1.358-.275-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .941-.1 1.358-.275.642 1.27 1.914 2.285 3.412 2.285s2.77-1.015 3.412-2.285c.417.175.878.275 1.358.275 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z" fill="#F59E0B"/><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 9c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm.5-4H10V9h1v2h1.5v1z" fill="white"/></svg>`;

  const coverSrcFull = biz.coverImage || '';
  const heroHtml = `
  <div style="position:relative;border-radius:20px;overflow:hidden;margin-bottom:16px;border:1px solid rgba(255,255,255,0.08)">
    ${coverSrcFull
      ? `<img src="${esc(coverSrcFull)}" alt="${esc(biz.name)}" style="width:100%;height:150px;object-fit:cover;display:block">`
      : biz.image
        ? `<img src="${esc(biz.image)}" alt="${esc(biz.name)}" style="width:100%;height:150px;object-fit:cover;display:block;opacity:0.25">`
        : `<div style="width:100%;height:150px;background:linear-gradient(135deg,#0A0E17,#1a2035)"></div>`
    }
    <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.72) 0%,transparent 55%)"></div>
    ${biz.image ? `<div style="position:absolute;bottom:14px;left:14px;width:64px;height:64px;border-radius:14px;border:3px solid rgba(255,255,255,0.88);overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.5);flex-shrink:0"><img src="${esc(biz.image)}" style="width:100%;height:100%;object-fit:cover"></div>` : ''}
    <div style="position:absolute;bottom:14px;${biz.image ? 'left:92px' : 'left:14px'};right:14px">
      <div style="font-size:1.1rem;font-weight:900;color:#fff;letter-spacing:-0.01em;text-shadow:0 1px 4px rgba(0,0,0,0.5);line-height:1.2">${esc(biz.name)}</div>
      ${biz.category ? `<div style="font-size:.68rem;color:#66ff4c;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;margin-top:3px">${esc(biz.category)}${biz.subCategory ? ` · ${esc(biz.subCategory)}` : ''}</div>` : ''}
    </div>
    <div style="position:absolute;top:10px;right:10px">
      ${biz.active
        ? `<span style="background:rgba(34,197,94,0.9);backdrop-filter:blur(4px);color:#fff;font-size:.65rem;font-weight:800;padding:4px 10px;border-radius:20px;display:inline-flex;align-items:center;gap:4px;text-transform:uppercase;letter-spacing:0.04em"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Active</span>`
        : `<span style="background:rgba(107,114,128,0.9);color:#fff;font-size:.65rem;font-weight:800;padding:4px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.04em">Inactive</span>`
      }
    </div>
  </div>
  <div style="padding:0 4px;margin-bottom:12px">
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      ${biz.district  ? `<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(102,255,76,0.06);color:#66ff4c;border:1px solid rgba(102,255,76,0.2);border-radius:20px;padding:4px 10px;font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:0.04em">${IC.mapPin} ${esc(biz.district)}</span>` : ''}
      ${biz.assembly  ? `<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(102,255,76,0.04);color:#a3e635;border:1px solid rgba(163,230,53,0.2);border-radius:20px;padding:4px 10px;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.04em">${esc(biz.assembly)}</span>` : ''}
    </div>
  </div>`;

  const body = `<div class="wrap">
  ${submitted ? `<div class="toast"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:4px"><polyline points="20 6 9 17 4 12"/></svg> Your review was submitted. Thank you!</div>` : ''}
  ${heroHtml}
  ${biz.description ? `<div class="section"><p style="font-size:.87rem;color:#d1d5db;line-height:1.6">${esc(biz.description)}</p></div>` : ''}

  ${locRows.length ? `<div class="section">
    <div class="sec-head">Location</div>
    ${locRows.map(([ic,v]) => `<div class="row-info"><span class="row-icon">${ic}</span><span class="row-val">${v}</span></div>`).join('')}
  </div>` : ''}

  ${contactRows.length ? `<div class="section">
    <div class="sec-head">Contact</div>
    ${contactRows.map(([ic,v]) => `<div class="row-info"><span class="row-icon">${ic}</span><span class="row-val">${v}</span></div>`).join('')}
  </div>` : ''}

  ${socialChips ? `<div class="section">
    <div class="sec-head">Social &amp; Media</div>
    <div style="display:flex;flex-wrap:wrap;margin:-3px">${socialChips}</div>
  </div>` : ''}

  ${(daysHtml || timeHtml) ? `<div class="section">
    <div class="sec-head">Business Hours</div>
    ${daysHtml ? `<div style="margin-bottom:6px">${daysHtml}</div>` : ''}
    ${timeHtml ? `<div style="font-size:.85rem;color:#9ca3af;display:flex;align-items:center;gap:6px">${IC.clock} ${esc(timeHtml)}</div>` : ''}
  </div>` : ''}

  ${validSvcs.length ? `<div class="section">
    <div class="sec-head">Services / Products</div>
    ${svcsHtml}
  </div>` : ''}

  ${galleryHtml ? `<div class="section">
    <div class="sec-head">Gallery</div>
    <div class="gallery-grid">${galleryHtml}</div>
  </div>` : ''}

  ${(biz.infoQuestion || biz.infoAnswer) ? `<div class="section">
    <div class="sec-head">FAQ</div>
    ${biz.infoQuestion ? `<div style="font-weight:700;font-size:.88rem;color:#ffffff;margin-bottom:5px;display:flex;align-items:flex-start;gap:6px">${IC.help} ${esc(biz.infoQuestion)}</div>` : ''}
    ${biz.infoAnswer ? `<div style="font-size:.83rem;color:#d1d5db;padding-left:21px">${esc(biz.infoAnswer)}</div>` : ''}
  </div>` : ''}

  <div class="section">
    <div class="sec-head">Reviews & Ratings</div>
    ${total > 0 ? `<div class="avg-row">
      <div class="avg-num">${avg.toFixed(1)}</div>
      <div>
        <div style="margin-bottom:2px;display:flex;align-items:center">${stars(avg)}</div>
        <div class="avg-label">${total} review${total !== 1 ? 's' : ''}</div>
      </div>
    </div>` : `<p style="font-size:.82rem;color:#9ca3af;margin-bottom:10px">No reviews yet — be the first!</p>`}
    ${revHtml}
  </div>

  <div class="section">
    <div class="sec-head">Add Your Review</div>
    <form method="POST" action="/public/dir/${esc(req.params.id)}/review${listQ}">
      <label>Your Name *</label>
      <input type="text" name="reviewerName" required placeholder="Enter your name" value="${esc(userName)}">
      <label>Rating *</label>
      <select name="rating" required>
        <option value="">— Select Rating —</option>
        <option value="5">★★★★★ Excellent</option>
        <option value="4">★★★★☆ Very Good</option>
        <option value="3">★★★☆☆ Good</option>
        <option value="2">★★☆☆☆ Fair</option>
        <option value="1">★☆☆☆☆ Poor</option>
      </select>
      <label>Review</label>
      <textarea name="text" rows="3" placeholder="Share your experience…"></textarea>
      <button type="submit" class="submit-btn">Submit Review</button>
    </form>
  </div>
</div>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(shell(biz.name, body, backUrl));
});

/* ── POST /public/dir/:id/review ── */
router.post('/:id/review', async (req, res) => {
  const { district = '', assembly = '', category = '' } = req.query;
  const listQ = `?district=${encodeURIComponent(district)}&assembly=${encodeURIComponent(assembly)}&category=${encodeURIComponent(category)}`;
  const { reviewerName, rating, text } = req.body;
  const ratingNum = parseInt(rating, 10);
  if (reviewerName && ratingNum >= 1 && ratingNum <= 5) {
    await Review.create({
      targetKind: 'business',
      targetId: req.params.id,
      rating: ratingNum,
      text: (text || '').trim(),
      reviewerName: reviewerName.trim(),
    }).catch(() => {});
  }
  res.redirect(`/public/dir/${req.params.id}${listQ}&submitted=1`);
});

module.exports = router;
