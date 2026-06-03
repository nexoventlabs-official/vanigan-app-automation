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
  { id:'fbLink',      label:'Facebook',     bg:'#e7f0fd', border:'#1877F244', color:'#1877F2', icon:'<svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' },
  { id:'twitterLink', label:'Twitter / X',  bg:'#f0f0f0', border:'#00000022', color:'#000000', icon:'<svg width="16" height="16" viewBox="0 0 24 24" style="background:#000;border-radius:4px;padding:2.5px;box-sizing:border-box;display:block"><path fill="#fff" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' },
  { id:'instaLink',   label:'Instagram',    bg:'#fce4f1', border:'#C1358444', color:'#C13584', icon:'<svg width="16" height="16" viewBox="0 0 24 24" style="background:radial-gradient(circle at 30% 107%,#fdf497 0%,#fdf497 5%,#fd5949 45%,#d6249f 60%,#285AEB 90%);border-radius:4px;padding:2.2px;box-sizing:border-box;display:block"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.5" fill="#fff"/></svg>' },
  { id:'googleMap',   label:'Google Maps',  bg:'#e8f0fe', border:'#1A73E844', color:'#1A73E8', icon:'<svg width="24" height="24" viewBox="0 0 24 24"><path fill="#4285F4" d="M12 2C8.13 2 5 5.13 5 9c0 1.7.52 3.28 1.41 4.58L12 22l5.59-8.42A6.96 6.96 0 0 0 19 9c0-3.87-3.13-7-7-7z"/><path fill="#34A853" d="M12 22l5.59-8.42A6.96 6.96 0 0 1 12 9v13z"/><path fill="#FBBC04" d="M5 9c0 1.7.52 3.28 1.41 4.58L12 22V9H5z"/><circle fill="white" cx="12" cy="9" r="2.8"/></svg>' },
  { id:'videoUrl',    label:'YouTube',      bg:'#ffe8e8', border:'#FF000044', color:'#FF0000', icon:'<svg width="24" height="24" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>' },
];

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
:root {
  --bg-color: #030712;
  --bg-image: radial-gradient(rgba(102,255,76,0.04) 1.5px, transparent 1.5px);
  --bg-spotlight: radial-gradient(circle at top, rgba(102,255,76,0.07) 0%, transparent 70%);
  --card-bg: #0A0E17;
  --card-border: rgba(255,255,255,0.06);
  --card-hover-border: rgba(102,255,76,0.25);
  --card-hover-shadow: rgba(102,255,76,0.05);
  --text-main: #ffffff;
  --text-muted: #9ca3af;
  --text-bright: #e5e7eb;
  --topbar-bg: rgba(10, 14, 23, 0.85);
  --topbar-border: rgba(102,255,76,0.15);
  --input-bg: rgba(0, 0, 0, 0.5);
  --input-border: rgba(255,255,255,0.08);
  --input-focus-bg: rgba(0, 0, 0, 0.8);
  --chip-bg: rgba(102, 255, 76, 0.06);
  --chip-border: rgba(102, 255, 76, 0.2);
  --days-tag-bg: rgba(102, 255, 76, 0.05);
  --days-tag-border: rgba(102, 255, 76, 0.15);
  --avg-row-bg: rgba(255, 255, 255, 0.02);
  --avg-row-border: rgba(255, 255, 255, 0.04);
  --divider: rgba(255, 255, 255, 0.04);
  --soc-chip-bg: #06080D;
  --soc-chip-border: rgba(255,255,255,0.08);
  --soc-chip-text: #e5e7eb;
  --soc-chip-hover-bg: rgba(255,255,255,0.02);
  --accent-color: #66ff4c;
  --accent-hover: #52e038;
  --accent-rgb: 102, 255, 76;
}

[data-theme="light"] {
  --bg-color: #f9fafb;
  --bg-image: radial-gradient(rgba(22,163,74,0.05) 1.5px, transparent 1.5px);
  --bg-spotlight: radial-gradient(circle at top, rgba(22,163,74,0.06) 0%, transparent 70%);
  --card-bg: #ffffff;
  --card-border: rgba(0,0,0,0.08);
  --card-hover-border: rgba(22,163,74,0.35);
  --card-hover-shadow: rgba(22,163,74,0.06);
  --text-main: #111827;
  --text-muted: #4b5563;
  --text-bright: #374151;
  --topbar-bg: rgba(255, 255, 255, 0.9);
  --topbar-border: rgba(22,163,74,0.15);
  --input-bg: rgba(255, 255, 255, 0.9);
  --input-border: rgba(0,0,0,0.12);
  --input-focus-bg: #ffffff;
  --chip-bg: rgba(22, 163, 74, 0.06);
  --chip-border: rgba(22, 163, 74, 0.2);
  --days-tag-bg: rgba(22, 163, 74, 0.05);
  --days-tag-border: rgba(22, 163, 74, 0.15);
  --avg-row-bg: rgba(0, 0, 0, 0.02);
  --avg-row-border: rgba(0, 0, 0, 0.04);
  --divider: rgba(0, 0, 0, 0.05);
  --soc-chip-bg: #f3f4f6;
  --soc-chip-border: rgba(0,0,0,0.08);
  --soc-chip-text: #374151;
  --soc-chip-hover-bg: rgba(0,0,0,0.02);
  --accent-color: #16a34a;
  --accent-hover: #15803d;
  --accent-rgb: 22, 163, 74;
}

body{
  font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color:var(--bg-color);
  background-image:var(--bg-image);
  background-size:24px 24px;
  min-height:100vh;
  color:var(--text-main);
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
  background:var(--bg-spotlight);
  pointer-events:none;
  z-index:0;
}
.top-bar{
  background:var(--topbar-bg);
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  border-bottom:1px solid var(--topbar-border);
  color:var(--text-main);
  padding:14px 16px;
  display:flex;
  align-items:center;
  gap:12px;
  position:sticky;
  top:0;
  z-index:10;
}
.top-bar a{color:var(--accent-color);text-decoration:none;font-size:.85rem;font-weight:700;transition:all 0.2s}
.top-bar a:hover{text-shadow:0 0 8px rgba(var(--accent-rgb),0.5)}
.top-bar h1{font-size:1.1rem;font-weight:900;letter-spacing:-0.01em;flex:1}
.top-bar p{font-size:.75rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;font-weight:600}
.wrap{max-width:600px;margin:0 auto;padding:16px;position:relative;z-index:1}
.chip{
  display:inline-flex;
  align-items:center;
  background:var(--chip-bg);
  color:var(--accent-color);
  border-radius:20px;
  padding:5px 12px;
  font-size:.7rem;
  font-weight:800;
  margin-right:6px;
  margin-bottom:8px;
  border:1px solid var(--chip-border);
  text-transform:uppercase;
  letter-spacing:0.04em;
  box-shadow:0 0 10px rgba(var(--accent-rgb),0.04);
}
.biz-card{
  background:var(--card-bg);
  border-radius:16px;
  margin-bottom:16px;
  overflow:hidden;
  display:flex;
  flex-direction:column;
  border:1px solid var(--card-border);
  box-shadow:0 4px 20px rgba(0,0,0,0.4);
  transition:all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position:relative;
  z-index:1;
}
.biz-card:hover{
  border-color:var(--card-hover-border);
  transform:translateY(-2px);
  box-shadow:0 12px 30px var(--card-hover-shadow);
}
.biz-card-img{
  width:90px;
  height:90px;
  object-fit:cover;
  border-radius:10px;
  margin:14px 0 14px 14px;
  border:1px solid var(--card-border);
}
.biz-card-no-img{
  width:90px;
  height:90px;
  background:rgba(var(--accent-rgb),0.02);
  border:1px solid var(--card-border);
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:1.6rem;
  border-radius:10px;
  margin:14px 0 14px 14px;
  color:var(--accent-color);
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
  color:var(--text-main);
  margin-bottom:4px;
  letter-spacing:-0.018em;
  display:flex;
  align-items:center;
  gap:6px;
}
.biz-cat{
  font-size:.7rem;
  color:var(--accent-color);
  font-weight:750;
  margin-bottom:6px;
  text-transform:uppercase;
  letter-spacing:0.06em;
}
.biz-desc{font-size:.78rem;color:var(--text-muted);margin-bottom:8px;line-height:1.45}
.biz-phone{font-size:.8rem;color:var(--text-bright)}
.biz-phone a{color:var(--accent-color);text-decoration:none;font-weight:750;font-size:0.82rem;display:inline-flex;align-items:center;gap:4px}
.biz-call-btn-container{
  display:flex;
  align-items:center;
  justify-content:center;
  padding-right:16px;
  flex-shrink:0;
}
.biz-call-btn{
  display:flex;
  align-items:center;
  justify-content:center;
  width:42px;
  height:42px;
  border-radius:50%;
  background:rgba(var(--accent-rgb),0.08);
  border:1px solid rgba(var(--accent-rgb),0.25);
  color:var(--accent-color);
  transition:all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:0 0 10px rgba(var(--accent-rgb),0.05);
}
.biz-call-btn:hover{
  background:var(--accent-color);
  color:#ffffff;
  transform:scale(1.08);
  box-shadow:0 0 15px rgba(var(--accent-rgb),0.4);
}
.biz-name-link{
  text-decoration:none;
  color:inherit;
}
.biz-name-link:hover .biz-name{
  color:var(--accent-color);
}

.empty{text-align:center;padding:48px 16px;color:#6b7280}
.empty .icon{font-size:48px;margin-bottom:12px;filter:drop-shadow(0 0 8px rgba(var(--accent-rgb),0.15))}
/* detail */
.cover{width:100%;height:160px;object-fit:cover;border-radius:20px;margin-bottom:16px;border:1px solid var(--card-border)}
.biz-title{
  font-size:1.45rem;
  font-weight:900;
  color:var(--text-main);
  margin-bottom:6px;
  letter-spacing:-0.02em;
  display:flex;
  align-items:center;
  gap:8px;
}
.biz-sub{font-size:.82rem;color:var(--text-muted);margin-bottom:16px;font-weight:500}
.section{
  background:var(--card-bg);
  border-radius:18px;
  padding:20px;
  margin-bottom:16px;
  border:1px solid var(--card-border);
  box-shadow:0 8px 24px rgba(0,0,0,0.4);
}
.sec-head{
  font-size:.72rem;
  font-weight:900;
  color:var(--accent-color);
  text-transform:uppercase;
  letter-spacing:.1em;
  margin-bottom:14px;
  padding-bottom:8px;
  border-bottom:1px solid var(--topbar-border);
}
.row-info{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--divider);align-items:center}
.row-info:last-child{border-bottom:none}
.row-icon{font-size:1rem;width:24px;color:var(--text-muted);flex-shrink:0;display:flex;justify-content:center;align-items:center}
.row-val{font-size:.88rem;color:var(--text-bright);word-break:break-word;line-height:1.45}
.row-val a{color:var(--accent-color);text-decoration:none;font-weight:750;transition:all 0.2s}
.row-val a:hover{text-shadow:0 0 8px rgba(var(--accent-rgb),0.3)}
.svc-item{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--divider)}
.svc-item:last-child{border-bottom:none}
.svc-img{width:56px;height:56px;object-fit:cover;border-radius:8px;border:1px solid var(--card-border);flex-shrink:0}
.svc-name{font-weight:800;font-size:.88rem;color:var(--text-main)}
.svc-price{font-size:.82rem;color:var(--accent-color);font-weight:800;margin-left:6px}
.svc-detail{font-size:.78rem;color:var(--text-muted);margin-top:4px;line-height:1.45}
.gallery-grid{display:flex;flex-wrap:wrap;gap:8px}
.gallery-grid img{width:80px;height:80px;object-fit:cover;border-radius:12px;cursor:pointer;border:1px solid var(--card-border);transition:all 0.2s}
.gallery-grid img:hover{transform:scale(1.05);border-color:var(--accent-color)}
.rev-item{padding:12px 0;border-bottom:1px solid var(--divider)}
.rev-item:last-child{border-bottom:none}
.rev-stars{color:#f59e0b;font-size:.9rem}
.rev-name{font-weight:700;font-size:.82rem;color:var(--text-main);margin-left:6px}
.rev-text{font-size:.82rem;color:var(--text-bright);margin-top:6px;line-height:1.45}
.avg-row{
  display:flex;
  align-items:center;
  gap:16px;
  margin-bottom:16px;
  background:var(--avg-row-bg);
  border:1px solid var(--avg-row-border);
  padding:14px 18px;
  border-radius:12px;
}
.avg-num{font-size:2.4rem;font-weight:900;color:var(--text-main);letter-spacing:-0.02em}
.avg-label{font-size:.8rem;color:var(--text-muted);font-weight:600;margin-top:2px}
label{display:block;font-size:10px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;margin-top:8px}
input,textarea,select{
  width:100%;
  border:1px solid var(--input-border);
  border-radius:10px;
  padding:12px 14px;
  font-size:.88rem;
  outline:none;
  background-color:var(--input-bg);
  color:var(--text-main);
  margin-bottom:14px;
  transition:all .25s;
}
input:focus,textarea:focus,select:focus{
  border-color:var(--accent-color);
  background-color:var(--input-focus-bg);
  box-shadow:0 0 12px rgba(var(--accent-rgb),0.15);
}
select{
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2366ff4c' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
  background-position: right 0.75rem center;
  background-size: 1.25rem 1.25rem;
  background-repeat: no-repeat;
  padding-right: 2.5rem;
}
[data-theme="light"] select{
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2316a34a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
}
select option{
  background-color: var(--card-bg);
  color: var(--text-main);
}
textarea{resize:vertical}
.submit-btn{
  width:100%;
  background:var(--accent-color);
  color:var(--bg-color);
  font-weight:850;
  padding:12px;
  border-radius:10px;
  border:none;
  font-size:.85rem;
  text-transform:uppercase;
  letter-spacing:0.05em;
  cursor:pointer;
  transition:all .2s;
  box-shadow:0 0 12px rgba(var(--accent-rgb),0.25);
}
.submit-btn:hover{background:var(--accent-hover);transform:translateY(-1px)}
.days-tag{
  display:inline-block;
  background:var(--days-tag-bg);
  color:var(--accent-color);
  border-radius:6px;
  padding:4px 10px;
  font-size:.7rem;
  font-weight:800;
  margin:3px;
  border:1px solid var(--days-tag-border);
  text-transform:uppercase;
  letter-spacing:0.02em;
}
.toast{background:var(--avg-row-bg);border:1px solid var(--topbar-border);color:var(--accent-color);border-radius:12px;padding:12px 14px;font-size:.85rem;font-weight:600;margin-bottom:16px}

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
  gap:8px;
  padding:8px 14px;
  border-radius:12px;
  border:1px solid var(--soc-chip-border);
  background:var(--soc-chip-bg);
  color:var(--soc-chip-text);
  font-size:.72rem;
  font-weight:700;
  text-transform:uppercase;
  letter-spacing:0.06em;
  text-decoration:none;
  transition:all 0.2s;
  margin:4px 4px 4px 0;
}
.soc-chip:hover{border-color:var(--accent-color);background:var(--soc-chip-hover-bg)}

.theme-toggle {
  background: none;
  border: none;
  color: var(--accent-color);
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  margin-left: 8px;
}
.theme-toggle:hover {
  background: rgba(var(--accent-rgb), 0.1);
  transform: rotate(15deg) scale(1.1);
}
[data-theme="light"] .theme-toggle {
  color: var(--text-main);
}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:var(--bg-color)}
::-webkit-scrollbar-thumb{background:rgba(var(--accent-rgb),0.3);border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:rgba(var(--accent-rgb),0.5)}
`;

function shell(title, body, backUrl='', showSubtitle=true) {
  const back = backUrl ? `<a href="${esc(backUrl)}">← Back</a>` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Vanigan</title>
<style>${CSS}</style>
<script>
  (function() {
    const savedTheme = localStorage.getItem('vanigan-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  })();
</script>
</head>
<body>
<div class="top-bar">
  ${back}
  <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0">
    <h1><img src="https://vanigan.org/front/images/home/tnvslogo.png" alt="Vanigan" style="height:28px;width:auto;vertical-align:middle;display:inline-block"></h1>
    ${(showSubtitle && title !== 'Vanigan') ? `<p>${esc(title)}</p>` : ''}
  </div>
  <button id="themeToggleBtn" class="theme-toggle" aria-label="Toggle Theme">
    <!-- Sun (shows in Light theme to switch to Dark) -->
    <svg class="sun-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
    <!-- Moon (shows in Dark theme to switch to Light) -->
    <svg class="moon-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
  </button>
</div>
${body}
<script>
  (function() {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    const sun = btn.querySelector('.sun-icon');
    const moon = btn.querySelector('.moon-icon');

    function updateIcons(theme) {
      if (theme === 'light') {
        sun.style.display = 'block';
        moon.style.display = 'none';
      } else {
        sun.style.display = 'none';
        moon.style.display = 'block';
      }
    }

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    updateIcons(currentTheme);

    btn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const newTheme = isDark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('vanigan-theme', newTheme);
      updateIcons(newTheme);
    });
  })();
</script>
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
  const { district = '', assembly = '', category = '', subcategory = '', name: userName = '', phone: userPhone = '' } = req.query;
  const filter = { active: true };
  if (district) filter.district = district;
  if (assembly) filter.assembly = assembly;
  if (category) filter.category = category;
  if (subcategory && subcategory !== 'All') filter.subCategory = subcategory;

  const businesses = await Business.find(filter).sort({ name: 1 }).limit(100).lean().catch(() => []);

  const locLabel = [assembly, district].filter(Boolean).join(', ') || 'All Areas';
  const subLabel = (subcategory && subcategory !== 'All') ? ` → ${subcategory}` : '';
  const catLabel = category ? `${category}${subLabel}` : 'All Categories';
  const pageTitle = `Businesses – ${locLabel}`;

  const listQ = `?district=${encodeURIComponent(district)}&assembly=${encodeURIComponent(assembly)}&category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}${userName ? '&name=' + encodeURIComponent(userName) : ''}${userPhone ? '&phone=' + encodeURIComponent(userPhone) : ''}`;

  let cards = '';
  if (!businesses.length) {
    cards = `<div class="empty"><div style="margin-bottom:12px">${IC.search}</div><p>No businesses found for the selected filters.<br>Try changing the category or location.</p></div>`;
  } else {
    cards = businesses.map(b => {
      const imgTag = b.image
        ? `<img class="biz-card-img" src="${esc(b.image)}" alt="${esc(b.name)}" loading="lazy">`
        : `<div class="biz-card-no-img">${IC.store}</div>`;
      const phone = b.phone || b.whatsappNo || '';
      const phoneHtml = phone ? `<div class="biz-phone" style="margin-top:6px;font-size:0.82rem"><a href="tel:${esc(phone)}" onclick="event.stopPropagation()" style="color:var(--accent-color);text-decoration:none;font-weight:700;display:inline-flex;align-items:center;gap:6px">${IC.phone} ${esc(phone)}</a></div>` : '';
      const desc = (b.description || b.address || '').substring(0, 80);
      const activeBadge = b.active
        ? `<svg viewBox="0 0 24 24" width="16" height="16" style="display:inline-block;vertical-align:middle;margin-left:4px;flex-shrink:0" fill="currentColor" title="Verified active business"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.941.1-1.358.275C14.77 2.515 13.498 1.5 12 1.5s-2.77 1.015-3.412 2.285c-.417-.175-.878-.275-1.358-.275-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .941-.1 1.358-.275.642 1.27 1.914 2.285 3.412 2.285s2.77-1.015 3.412-2.285c.417.175.878.275 1.358.275 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z" fill="#0095F6"/><path d="M9.78 16.72l-3.86-3.86 1.41-1.41 2.45 2.45 6.18-6.18 1.41 1.41-7.59 7.59z" fill="white"/></svg>`
        : '';
      const detailUrl = `/public/dir/${esc(b._id.toString())}${listQ}`;
      return `<div class="biz-card" onclick="window.location.href='${detailUrl}'" style="cursor:pointer">
  <div style="display:flex;align-items:stretch;width:100%">
    <div style="display:flex;align-items:center;flex-shrink:0">
      ${imgTag}
    </div>
    <div class="biz-card-body">
      <div class="biz-name">${esc(b.name)}${activeBadge}</div>
      ${b.category ? `<div class="biz-cat">${esc(b.category)}</div>` : ''}
      ${desc ? `<div class="biz-desc">${esc(desc)}</div>` : ''}
      ${phoneHtml}
    </div>
    ${phone ? `
    <div class="biz-call-btn-container">
      <a href="tel:${esc(phone)}" class="biz-call-btn" title="Call Business" onclick="event.stopPropagation()">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="display:block"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.57a1 1 0 0 0-1.01.24l-2.2 2.2a15.045 15.045 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"/></svg>
      </a>
    </div>` : ''}
  </div>
</div>`;
    }).join('');
  }

  const body = `<div class="wrap">
  <div style="margin-bottom:14px">
    <span class="chip">${IC.mapPin} ${esc(locLabel)}</span>
    <span class="chip">${IC.tag} ${esc(catLabel)}</span>
    <p style="font-size:.78rem;color:var(--text-muted);margin-top:6px">${businesses.length} result${businesses.length !== 1 ? 's' : ''}</p>
  </div>
  ${cards}
</div>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(shell(pageTitle, body, '', false));
});

/* ── GET /public/dir/:id — business detail ── */
router.get('/:id', async (req, res) => {
  const { district = '', assembly = '', category = '', subcategory = '', name: userName = '', phone: userPhone = '' } = req.query;
  const backUrl = `/public/dir?district=${encodeURIComponent(district)}&assembly=${encodeURIComponent(assembly)}&category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}${userName ? '&name=' + encodeURIComponent(userName) : ''}${userPhone ? '&phone=' + encodeURIComponent(userPhone) : ''}`;

  let biz;
  try { biz = await Business.findById(req.params.id).lean(); } catch { biz = null; }
  if (!biz) {
    return res.status(404).setHeader('Content-Type','text/html').send(
      shell('Not Found', `<div class="wrap"><div class="empty"><div class="icon">❌</div><p>Business not found.</p></div></div>`, backUrl, false)
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
    .map(p => `<a class="soc-chip" href="${esc(biz[p.id])}" target="_blank" rel="noreferrer">${p.icon} ${p.label}</a>`)
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

  const listQ = `?district=${encodeURIComponent(district)}&assembly=${encodeURIComponent(assembly)}&category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}${userName ? '&name=' + encodeURIComponent(userName) : ''}${userPhone ? '&phone=' + encodeURIComponent(userPhone) : ''}`;

  /* find this user's existing review — phone match first, then name fallback */
  const myReview = reviews.find(r =>
    (userPhone && r.phone && r.phone === userPhone) ||
    (userName && r.reviewerName && r.reviewerName.trim().toLowerCase() === userName.trim().toLowerCase())
  ) || null;

  const activeBadge = biz.active
    ? `<svg viewBox="0 0 24 24" width="20" height="20" style="display:inline-block;vertical-align:middle;margin-left:6px;flex-shrink:0" fill="currentColor" title="Verified active business"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.941.1-1.358.275C14.77 2.515 13.498 1.5 12 1.5s-2.77 1.015-3.412 2.285c-.417-.175-.878-.275-1.358-.275-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .941-.1 1.358-.275.642 1.27 1.914 2.285 3.412 2.285s2.77-1.015 3.412-2.285c.417.175.878.275 1.358.275 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z" fill="#0095F6"/><path d="M9.78 16.72l-3.86-3.86 1.41-1.41 2.45 2.45 6.18-6.18 1.41 1.41-7.59 7.59z" fill="white"/></svg>`
    : `<svg viewBox="0 0 24 24" width="20" height="20" style="display:inline-block;vertical-align:middle;margin-left:6px;flex-shrink:0" class="anim-pulse" fill="currentColor" title="Pending review"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.941.1-1.358.275C14.77 2.515 13.498 1.5 12 1.5s-2.77 1.015-3.412 2.285c-.417-.175-.878-.275-1.358-.275-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .941-.1 1.358-.275.642 1.27 1.914 2.285 3.412 2.285s2.77-1.015 3.412-2.285c.417.175.878.275 1.358.275 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z" fill="#F59E0B"/><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 9c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm.5-4H10V9h1v2h1.5v1z" fill="white"/></svg>`;

  const coverSrcFull = biz.coverImage || '';
  const heroHtml = `
  <div style="position:relative;border-radius:20px;overflow:hidden;margin-bottom:16px;border:1px solid var(--card-border)">
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
      ${biz.category ? `<div style="font-size:.68rem;color:var(--accent-color);font-weight:800;text-transform:uppercase;letter-spacing:0.05em;margin-top:3px">${esc(biz.category)}${biz.subCategory ? ` · ${esc(biz.subCategory)}` : ''}</div>` : ''}
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
      ${biz.district  ? `<span style="display:inline-flex;align-items:center;gap:4px;background:var(--chip-bg);color:var(--accent-color);border:1px solid var(--chip-border);border-radius:20px;padding:4px 10px;font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:0.04em">${IC.mapPin} ${esc(biz.district)}</span>` : ''}
      ${biz.assembly  ? `<span style="display:inline-flex;align-items:center;gap:4px;background:var(--chip-bg);color:var(--accent-color);border:1px solid var(--chip-border);border-radius:20px;padding:4px 10px;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.04em">${esc(biz.assembly)}</span>` : ''}
    </div>
  </div>`;

  /* Is this the owner viewing their own listing? */
  const isOwner = userPhone && biz.ownerPhone &&
    String(userPhone).replace(/\D/g,'') === String(biz.ownerPhone).replace(/\D/g,'');

  const ownerBanner = isOwner ? `
  <div style="background:rgba(var(--accent-rgb),0.06);border:1px solid rgba(var(--accent-rgb),0.2);border-radius:14px;padding:14px 16px;margin-bottom:16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
    <div style="flex:1;min-width:0">
      <div style="font-size:.72rem;font-weight:900;color:var(--accent-color);text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px">🏪 Your Business</div>
      <div style="font-size:.82rem;color:var(--text-muted)">You are viewing your own listing.</div>
    </div>
    <div style="display:flex;gap:8px;flex-shrink:0">
      <a href="/public/dir/${esc(req.params.id)}/edit?phone=${esc(userPhone)}"
        style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:var(--accent-color);color:rgba(0,0,0,0.9);border-radius:10px;font-size:.8rem;font-weight:800;text-decoration:none;text-transform:uppercase;letter-spacing:.04em;transition:all .15s">
        ✏️ Edit
      </a>
      <button onclick="confirmDelete()"
        style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.25);border-radius:10px;font-size:.8rem;font-weight:800;cursor:pointer;text-transform:uppercase;letter-spacing:.04em;transition:all .15s">
        🗑️ Delete
      </button>
    </div>
  </div>
  <div id="deleteModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(4px);z-index:999;align-items:center;justify-content:center;padding:16px">
    <div style="background:var(--card-bg);border:1px solid var(--card-border);border-radius:20px;padding:28px 24px;max-width:380px;width:100%;text-align:center">
      <div style="font-size:2rem;margin-bottom:12px">⚠️</div>
      <h2 style="font-size:1.1rem;font-weight:900;margin-bottom:8px;color:var(--text-main)">Delete Listing?</h2>
      <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:20px">This will permanently remove <strong style="color:var(--text-main)">${esc(biz.name)}</strong> from Vanigan. This cannot be undone.</p>
      <p style="font-size:.82rem;color:var(--text-muted);margin-bottom:14px">Enter your 4-digit PIN to confirm:</p>
      <div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px" id="delPinWrap">
        <input type="password" maxlength="1" inputmode="numeric" style="width:48px;height:56px;text-align:center;font-size:1.5rem;font-weight:900;border:2px solid rgba(255,255,255,0.1);border-radius:10px;background:rgba(0,0,0,0.3);color:#fff;outline:none" oninput="moveFocus(this,1)" onkeydown="backFocus(this,event,0)">
        <input type="password" maxlength="1" inputmode="numeric" style="width:48px;height:56px;text-align:center;font-size:1.5rem;font-weight:900;border:2px solid rgba(255,255,255,0.1);border-radius:10px;background:rgba(0,0,0,0.3);color:#fff;outline:none" oninput="moveFocus(this,2)" onkeydown="backFocus(this,event,1)">
        <input type="password" maxlength="1" inputmode="numeric" style="width:48px;height:56px;text-align:center;font-size:1.5rem;font-weight:900;border:2px solid rgba(255,255,255,0.1);border-radius:10px;background:rgba(0,0,0,0.3);color:#fff;outline:none" oninput="moveFocus(this,3)" onkeydown="backFocus(this,event,2)">
        <input type="password" maxlength="1" inputmode="numeric" style="width:48px;height:56px;text-align:center;font-size:1.5rem;font-weight:900;border:2px solid rgba(255,255,255,0.1);border-radius:10px;background:rgba(0,0,0,0.3);color:#fff;outline:none" oninput="moveFocus(this,4)" onkeydown="backFocus(this,event,3)">
      </div>
      <div id="delErr" style="color:#f87171;font-size:.8rem;margin-bottom:12px;min-height:18px"></div>
      <div style="display:flex;gap:10px">
        <button onclick="closeDelete()" style="flex:1;padding:10px;border:1px solid var(--card-border);background:transparent;color:var(--text-main);border-radius:10px;font-weight:700;cursor:pointer">Cancel</button>
        <button id="delConfirmBtn" onclick="submitDelete()" style="flex:1;padding:10px;background:#ef4444;color:#fff;border:none;border-radius:10px;font-weight:800;cursor:pointer">Delete</button>
      </div>
    </div>
  </div>
  <script>
    function confirmDelete() { document.getElementById('deleteModal').style.display='flex'; document.querySelectorAll('#delPinWrap input')[0].focus(); }
    function closeDelete()   { document.getElementById('deleteModal').style.display='none'; document.querySelectorAll('#delPinWrap input').forEach(i=>i.value=''); document.getElementById('delErr').textContent=''; }
    function moveFocus(el,next){ el.value=el.value.replace(/\\D/g,'').slice(-1); if(el.value){const inputs=document.querySelectorAll('#delPinWrap input');if(inputs[next])inputs[next].focus();} }
    function backFocus(el,e,prev){ if(e.key==='Backspace'&&!el.value){const inputs=document.querySelectorAll('#delPinWrap input');if(inputs[prev])inputs[prev].focus();} }
    async function submitDelete(){
      const inputs=document.querySelectorAll('#delPinWrap input');
      const pin=Array.from(inputs).map(i=>i.value).join('');
      if(pin.length<4){document.getElementById('delErr').textContent='Enter your 4-digit PIN';return;}
      const btn=document.getElementById('delConfirmBtn');
      btn.textContent='Deleting…';btn.disabled=true;
      try{
        const r=await fetch('/public/dir/${esc(req.params.id)}/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:'${esc(userPhone)}',pin})});
        const d=await r.json();
        if(!r.ok){document.getElementById('delErr').textContent=d.error||'Failed';btn.textContent='Delete';btn.disabled=false;return;}
        window.location.href='/public/dir?deleted=1';
      }catch(e){document.getElementById('delErr').textContent='Connection error';btn.textContent='Delete';btn.disabled=false;}
    }
  </script>
  ` : '';

  const body = `<div class="wrap">
  ${ownerBanner}
  ${submitted ? `<div class="toast"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:4px"><polyline points="20 6 9 17 4 12"/></svg> Your review was submitted. Thank you!</div>` : ''}
  ${heroHtml}
  ${biz.description ? `<div class="section"><p style="font-size:.87rem;color:var(--text-bright);line-height:1.6">${esc(biz.description)}</p></div>` : ''}

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
    ${timeHtml ? `<div style="font-size:.85rem;color:var(--text-muted);display:flex;align-items:center;gap:6px">${IC.clock} ${esc(timeHtml)}</div>` : ''}
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
    ${biz.infoQuestion ? `<div style="font-weight:700;font-size:.88rem;color:var(--text-main);margin-bottom:5px;display:flex;align-items:flex-start;gap:6px">${IC.help} ${esc(biz.infoQuestion)}</div>` : ''}
    ${biz.infoAnswer ? `<div style="font-size:.83rem;color:var(--text-bright);padding-left:21px">${esc(biz.infoAnswer)}</div>` : ''}
  </div>` : ''}

  <div class="section">
    <div class="sec-head">Reviews & Ratings</div>
    ${total > 0 ? `<div class="avg-row">
      <div class="avg-num">${avg.toFixed(1)}</div>
      <div>
        <div style="margin-bottom:2px;display:flex;align-items:center">${stars(avg)}</div>
        <div class="avg-label">${total} review${total !== 1 ? 's' : ''}</div>
      </div>
    </div>` : `<p style="font-size:.82rem;color:var(--text-muted);margin-bottom:10px">No reviews yet — be the first!</p>`}
    ${revHtml}
  </div>

  <div class="section">
    <div class="sec-head">Add Your Review</div>
    ${myReview
      ? `<div style="background:rgba(var(--accent-rgb),0.04);border:1px solid rgba(var(--accent-rgb),0.18);border-radius:14px;padding:16px">
           <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
             <span style="font-size:.72rem;font-weight:900;color:var(--accent-color);text-transform:uppercase;letter-spacing:.08em">Your Review</span>
           </div>
           <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
             <span style="font-size:1rem;letter-spacing:1px">${stars(myReview.rating)}</span>
             <span style="font-size:.82rem;font-weight:800;color:var(--text-main)">${esc(myReview.reviewerName || userName)}</span>
           </div>
           ${myReview.text ? `<div style="font-size:.83rem;color:var(--text-bright);line-height:1.55;margin-top:6px">${esc(myReview.text)}</div>` : ''}
         </div>`
      : `<form method="POST" action="/public/dir/${esc(req.params.id)}/review${listQ}">
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
         </form>`
    }
  </div>
</div>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(shell(biz.name, body, backUrl, false));
});

/* ── POST /public/dir/:id/review ── */
router.post('/:id/review', async (req, res) => {
  const { district = '', assembly = '', category = '', subcategory = '', name: userName = '', phone: userPhone = '' } = req.query;
  const listQ = `?district=${encodeURIComponent(district)}&assembly=${encodeURIComponent(assembly)}&category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}${userName ? '&name=' + encodeURIComponent(userName) : ''}${userPhone ? '&phone=' + encodeURIComponent(userPhone) : ''}`;
  const { reviewerName, rating, text } = req.body;
  const ratingNum = parseInt(rating, 10);
  if (reviewerName && ratingNum >= 1 && ratingNum <= 5) {
    /* one review per phone per business */
    const duplicate = userPhone
      ? await Review.findOne({ targetKind: 'business', targetId: req.params.id, phone: userPhone }).lean()
      : null;
    if (!duplicate) {
      await Review.create({
        targetKind: 'business',
        targetId: req.params.id,
        rating: ratingNum,
        text: (text || '').trim(),
        reviewerName: reviewerName.trim(),
        phone: userPhone || '',
      }).catch(() => {});
    }
  }
  res.redirect(`/public/dir/${req.params.id}${listQ}&submitted=1`);
});

/* ── POST /public/dir/:id/delete  (PIN-verified owner delete) ── */
router.post('/:id/delete', express.json(), async (req, res) => {
  const { phone, pin } = req.body || {};
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits || !/^\d{4}$/.test(String(pin || ''))) {
    return res.status(400).json({ error: 'Phone and 4-digit PIN required.' });
  }
  let biz;
  try { biz = await Business.findById(req.params.id); } catch { biz = null; }
  if (!biz) return res.status(404).json({ error: 'Not found' });
  if (String(biz.ownerPhone).replace(/\D/g,'') !== digits) {
    return res.status(403).json({ error: 'Phone does not match this listing.' });
  }
  if (!biz.ownerPin) return res.status(403).json({ error: 'No PIN set for this listing.' });
  const bcrypt = require('bcryptjs');
  const ok = await bcrypt.compare(String(pin), biz.ownerPin);
  if (!ok) return res.status(403).json({ error: 'Incorrect PIN.' });
  await biz.deleteOne();
  res.json({ ok: true });
});

/* ── GET /public/dir/:id/edit  (owner edit form) ── */
router.get('/:id/edit', async (req, res) => {
  const { phone: userPhone = '' } = req.query;
  const digits = String(userPhone).replace(/\D/g, '');
  let biz;
  try { biz = await Business.findById(req.params.id).lean(); } catch { biz = null; }
  if (!biz) return res.status(404).send(shell('Not Found', '<div class="wrap"><div class="empty"><p>Business not found.</p></div></div>', '', false));
  if (!digits || String(biz.ownerPhone).replace(/\D/g,'') !== digits) {
    return res.status(403).send(shell('Forbidden', '<div class="wrap"><div class="empty"><p>You do not have permission to edit this listing.</p></div></div>', '', false));
  }
  const backendUrl = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
  const CATEGORIES = ['Hospitals & Clinics','Transport','Electricals & Electronics','Education','Sports','Real Estate','Spa & Beauty','Digital & IT Products','Hire Services','Automobile','B2B Services','Banquets & Event Halls','Bills & Recharge','Caterers','Civil Contractors','Daily Needs','Doctors','Jobs','Jewellery','Labs & Diagnostics','Banking & Finance','Packers & Movers','Wedding Services','Hotels & Restaurants','Repairs','IT & Software','Construction Materials','Pest Control','Agriculture','Printing Services','Textiles & Garments','Travel & Tourism','Home Appliances','Demand Services','Religious','Organic Products','Advertising','Insurance','Advocate & Legal','Courier Services'];
  const val = (k) => esc(biz[k] || '');
  const SUB_CATS = require('../utils/subCategories');
  const SUB_CATS_JSON = JSON.stringify(SUB_CATS);
  const catOpts = CATEGORIES.map(c => `<option value="${esc(c)}"${biz.category===c?' selected':''}>${esc(c)}</option>`).join('');
  const DAYS_ALL = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const activeDays = biz.openDays ? biz.openDays.split(',').map(d=>d.trim()) : [];
  const errCode = req.query.err || '';
  const savedOk = req.query.saved === '1';
  const errMsg = errCode === 'wrongpin' ? 'Incorrect PIN. Please try again.'
    : errCode === 'nopin' ? 'No PIN is set for this account. Set a PIN below first.'
    : errCode === 'pin' ? 'Please enter your 4-digit PIN.'
    : errCode === 'pinmatch' ? 'New PINs do not match. Please try again.'
    : '';

  /* PIN boxes helper */
  const pinRow = (prefix, label) => `
    <div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px">${label}</div>
      <div style="display:flex;gap:10px">
        ${[0,1,2,3].map(i=>`<input type="password" maxlength="1" inputmode="numeric" data-pin="${prefix}" data-idx="${i}"
          style="width:52px;height:60px;text-align:center;font-size:1.5rem;font-weight:900;border:1px solid var(--input-border);border-radius:12px;background:var(--input-bg);color:var(--text-main);outline:none;transition:border-color .15s"
          oninput="pinInput(this)" onkeydown="pinBack(this,event)" onfocus="this.style.borderColor='var(--accent-color)'" onblur="this.style.borderColor='var(--input-border)'">`).join('')}
      </div>
    </div>`;

  /* Section card */
  const sec = (icon, title, content) => `
    <div class="section" style="margin-bottom:16px">
      <div class="sec-head">${icon} ${title}</div>
      ${content}
    </div>`;

  /* Field row */
  const row2 = (a, b) => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:0">${a}${b}</div>`;
  const field = (lbl, inp) => `<div><label style="display:block;font-size:10px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px;margin-top:14px">${lbl}</label>${inp}</div>`;
  const inp = (attrs) => `<input ${attrs} style="width:100%;border:1px solid var(--input-border);border-radius:10px;padding:11px 14px;font-size:.88rem;outline:none;background:var(--input-bg);color:var(--text-main);transition:all .25s;margin-bottom:0" onfocus="this.style.borderColor='var(--accent-color)';this.style.boxShadow='0 0 10px rgba(var(--accent-rgb),.15)'" onblur="this.style.borderColor='var(--input-border)';this.style.boxShadow='none'">`;
  const txta = (attrs, val) => `<textarea ${attrs} style="width:100%;border:1px solid var(--input-border);border-radius:10px;padding:11px 14px;font-size:.88rem;outline:none;background:var(--input-bg);color:var(--text-main);resize:vertical;transition:all .25s;margin-bottom:0" onfocus="this.style.borderColor='var(--accent-color)'" onblur="this.style.borderColor='var(--input-border)'">${val}</textarea>`;
  const sel = (attrs, opts) => `<select ${attrs} style="width:100%;border:1px solid var(--input-border);border-radius:10px;padding:11px 14px;font-size:.88rem;outline:none;background:var(--input-bg);color:var(--text-main);appearance:none;transition:all .25s;margin-bottom:0;background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%2366ff4c%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22m6 8 4 4 4-4%22/%3E%3C/svg%3E');background-position:right .75rem center;background-size:1.25rem;background-repeat:no-repeat;padding-right:2.5rem" onfocus="this.style.borderColor='var(--accent-color)'" onblur="this.style.borderColor='var(--input-border)'">${opts}</select>`;

  const daysHtml = DAYS_ALL.map(d => {
    const on = activeDays.includes(d);
    return `<button type="button" onclick="toggleDay(this,'${d}')" data-day="${d}" data-on="${on?'1':'0'}"
      style="padding:7px 14px;border-radius:20px;font-size:.8rem;font-weight:700;border:1px solid ${on?'var(--accent-color)':'var(--input-border)'};background:${on?'rgba(var(--accent-rgb),.1)':'transparent'};color:${on?'var(--accent-color)':'var(--text-muted)'};cursor:pointer;transition:all .15s">${d}</button>`;
  }).join('');

  const body = `<div class="wrap">
  ${savedOk ? `<div class="toast" style="margin-bottom:16px">✅ Changes saved successfully!</div>` : ''}
  ${errMsg ? `<div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:12px;padding:12px 16px;margin-bottom:16px;color:#f87171;font-size:.85rem;font-weight:600">${errMsg}</div>` : ''}

  <form id="editForm" method="POST" action="/public/dir/${esc(req.params.id)}/edit?phone=${esc(userPhone)}">
  <input type="hidden" name="pin" id="pinHidden">
  <input type="hidden" name="openDays" id="openDaysHidden" value="${esc(biz.openDays || '')}">

  ${sec('🏪', 'Basic Info', `
    ${field('Business Name *', inp(`type="text" name="name" value="${val('name')}" required placeholder="e.g. Sri Lakshmi Stores"`))}
    ${row2(
      field('Category', `<select name="category" id="catSel" onchange="refreshSubCat()" style="width:100%;border:1px solid var(--input-border);border-radius:10px;padding:11px 14px;font-size:.88rem;outline:none;background-color:var(--input-bg);color:var(--text-main);appearance:none;-webkit-appearance:none;background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%2366ff4c%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22m6 8 4 4 4-4%22/%3E%3C/svg%3E');background-position:right .75rem center;background-size:1.25rem 1.25rem;background-repeat:no-repeat;padding-right:2.5rem;margin-bottom:0"><option value="">— Select —</option>${catOpts}</select>`),
      field('Sub-Category', `<select name="subCategory" id="subCatSel" style="width:100%;border:1px solid var(--input-border);border-radius:10px;padding:11px 14px;font-size:.88rem;outline:none;background-color:var(--input-bg);color:var(--text-main);appearance:none;-webkit-appearance:none;background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%2366ff4c%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22m6 8 4 4 4-4%22/%3E%3C/svg%3E');background-position:right .75rem center;background-size:1.25rem 1.25rem;background-repeat:no-repeat;padding-right:2.5rem;margin-bottom:0"><option value="">— Select Sub-Category —</option></select>`)
    )}
    ${field('Description', txta(`name="description" rows="3" placeholder="Brief description of your business"`, val('description')))}
  `)}

  ${sec('📍', 'Location', `
    ${field('Address *', txta(`name="address" rows="2" required placeholder="Full business address"`, val('address')))}
    ${row2(
      field('Landmark', inp(`type="text" name="landmark" value="${val('landmark')}" placeholder="Near bus stand, opp. post office"`)),
      field('Service Areas', inp(`type="text" name="serviceLocations" value="${val('serviceLocations')}" placeholder="Areas you serve"`))
    )}
    ${row2(
      field('City', inp(`type="text" name="city" value="${val('city')}" placeholder="e.g. Chennai"`)),
      field('Pincode', inp(`type="text" name="pincode" value="${val('pincode')}" maxlength="6" inputmode="numeric" placeholder="6-digit PIN"`))
    )}
  `)}

  ${sec('📞', 'Contact', `
    ${row2(
      field('Primary Phone', inp(`type="tel" name="phone" value="${val('phone')}" placeholder="10-digit number"`)),
      field('WhatsApp No', inp(`type="tel" name="whatsappNo" value="${val('whatsappNo')}" placeholder="WhatsApp number"`))
    )}
    ${row2(
      field('Landline', inp(`type="tel" name="landline" value="${val('landline')}" placeholder="STD code + number"`)),
      field('Alternate Phone', inp(`type="tel" name="phone2" value="${val('phone2')}" placeholder="Optional"`))
    )}
    ${row2(
      field('Email', inp(`type="email" name="email" value="${val('email')}" placeholder="business@example.com"`)),
      field('Website', inp(`type="url" name="website" value="${val('website')}" placeholder="https://..."`))
    )}
  `)}

  ${sec('🔗', 'Social & Media', `
    ${field('Facebook', inp(`type="url" name="fbLink" value="${val('fbLink')}" placeholder="https://facebook.com/..."`))  }
    ${field('Instagram', inp(`type="url" name="instaLink" value="${val('instaLink')}" placeholder="https://instagram.com/..."`))}
    ${field('Twitter / X', inp(`type="url" name="twitterLink" value="${val('twitterLink')}" placeholder="https://twitter.com/..."`))}
    ${field('Google Maps', inp(`type="url" name="googleMap" value="${val('googleMap')}" placeholder="https://maps.google.com/..."`))}
    ${field('YouTube', inp(`type="url" name="videoUrl" value="${val('videoUrl')}" placeholder="https://youtube.com/..."`))}
  `)}

  ${sec('🕐', 'Hours', `
    <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;margin-top:14px">Opening Days</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px" id="daysWrap">${daysHtml}</div>
    ${row2(
      field('Open Time', inp(`type="time" name="openTime" value="${val('openTime')}"`)),
      field('Close Time', inp(`type="time" name="closeTime" value="${val('closeTime')}"`) )
    )}
  `)}

  ${sec('❓', 'FAQ', `
    ${field('Frequently Asked Question', inp(`type="text" name="infoQuestion" value="${val('infoQuestion')}" placeholder="e.g. Do you offer home delivery?"`))}
    ${field('Answer', txta(`name="infoAnswer" rows="2" placeholder="Your answer"`, val('infoAnswer')))}
  `)}

  ${sec('🔐', 'Confirm with PIN', `
    <p style="font-size:.83rem;color:var(--text-muted);margin-bottom:20px">Enter your current 4-digit PIN to save any changes above.</p>
    ${pinRow('current', 'Current PIN *')}
    <div id="editErr" style="color:#f87171;font-size:.82rem;min-height:18px;margin-top:-10px;margin-bottom:14px"></div>
    <button type="submit" class="submit-btn" id="saveBtn">Save Changes</button>
  `)}

  ${sec('🔑', `${biz.ownerPin ? 'Change PIN' : 'Set Security PIN'}`, `
    <p style="font-size:.83rem;color:var(--text-muted);margin-bottom:16px">${biz.ownerPin ? 'Change your 4-digit security PIN.' : 'Set a 4-digit PIN to protect your listing.'}</p>
    <button type="button" id="changePinBtn" onclick="openPinPanel()"
      style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:rgba(var(--accent-rgb),.06);color:var(--accent-color);border:1px solid rgba(var(--accent-rgb),.3);border-radius:12px;font-size:.85rem;font-weight:700;cursor:pointer;transition:all .2s">
      🔑 ${biz.ownerPin ? 'Change PIN' : 'Set PIN'}
    </button>
    <div id="pinPanel" style="display:none;margin-top:20px;background:var(--avg-row-bg);border:1px solid var(--card-border);border-radius:14px;padding:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <span style="font-size:.8rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.07em">${biz.ownerPin ? 'Change PIN' : 'Set PIN'}</span>
        <button type="button" onclick="closePinPanel()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.2rem;line-height:1">✕</button>
      </div>
      ${biz.ownerPin ? pinRow('chg_current', 'Current PIN *') : ''}
      ${pinRow('chg_new', 'New PIN *')}
      ${pinRow('chg_confirm', 'Confirm New PIN *')}
      <div id="pinPanelErr" style="color:#f87171;font-size:.82rem;margin-bottom:12px;min-height:18px"></div>
      <button type="button" id="updatePinBtn" onclick="submitPinChange()"
        style="width:100%;background:var(--accent-color);color:rgba(0,0,0,.9);font-weight:850;padding:12px;border-radius:10px;border:none;font-size:.85rem;text-transform:uppercase;letter-spacing:.05em;cursor:pointer;transition:all .2s">
        Update PIN
      </button>
    </div>
  `)}

  </form>
</div>

<script>
  const SUB_CATS = ${SUB_CATS_JSON};
  const CURRENT_SUBCAT = '${esc(biz.subCategory || '')}';
  const BACKEND_URL = '${backendUrl}';
  const BIZ_ID = '${esc(req.params.id)}';
  const OWNER_PHONE = '${esc(userPhone)}';

  /* ── Subcategory dropdown ── */
  function refreshSubCat(preserveVal) {
    const cat = document.getElementById('catSel').value;
    const sub = document.getElementById('subCatSel');
    const subs = SUB_CATS[cat] || [];
    sub.innerHTML = '<option value="">— Select Sub-Category —</option>';
    subs.forEach(s => {
      const o = document.createElement('option');
      o.value = s; o.textContent = s;
      if (s === (preserveVal !== undefined ? preserveVal : CURRENT_SUBCAT)) o.selected = true;
      sub.appendChild(o);
    });
    sub.style.display = subs.length ? '' : 'none';
  }
  /* Init on load */
  refreshSubCat(CURRENT_SUBCAT);

  /* ── Days toggle ── */
  function toggleDay(btn, day) {
    const on = btn.dataset.on === '1';
    btn.dataset.on = on ? '0' : '1';
    btn.style.borderColor = on ? 'var(--input-border)' : 'var(--accent-color)';
    btn.style.background  = on ? 'transparent' : 'rgba(var(--accent-rgb),.1)';
    btn.style.color       = on ? 'var(--text-muted)' : 'var(--accent-color)';
    const active = Array.from(document.querySelectorAll('#daysWrap button[data-on="1"]')).map(b=>b.dataset.day);
    document.getElementById('openDaysHidden').value = active.join(',');
  }

  /* ── PIN boxes ── */
  function pinInput(el) {
    el.value = el.value.replace(/\\D/g,'').slice(-1);
    const prefix = el.dataset.pin;
    const idx = parseInt(el.dataset.idx);
    if (el.value) {
      const next = document.querySelector('[data-pin="'+prefix+'"][data-idx="'+(idx+1)+'"]');
      if (next) next.focus();
    }
  }
  function pinBack(el, e) {
    if (e.key === 'Backspace' && !el.value) {
      const idx = parseInt(el.dataset.idx);
      const prefix = el.dataset.pin;
      const prev = document.querySelector('[data-pin="'+prefix+'"][data-idx="'+(idx-1)+'"]');
      if (prev) prev.focus();
    }
  }
  function getPin(prefix) {
    return Array.from(document.querySelectorAll('[data-pin="'+prefix+'"]')).map(i=>i.value).join('');
  }

  /* ── Main form submit ── */
  document.getElementById('editForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const currentPin = getPin('current');
    const editErr = document.getElementById('editErr');
    editErr.textContent = '';
    if (currentPin.length < 4) { editErr.textContent = 'Enter your current 4-digit PIN to save.'; return; }
    document.getElementById('pinHidden').value = currentPin;
    document.getElementById('saveBtn').textContent = 'Saving…';
    document.getElementById('saveBtn').disabled = true;
    this.submit();
  });

  /* ── Change PIN panel ── */
  function openPinPanel()  { document.getElementById('pinPanel').style.display = 'block'; }
  function closePinPanel() { document.getElementById('pinPanel').style.display = 'none'; clearPinPanel(); }
  function clearPinPanel() {
    ['chg_current','chg_new','chg_confirm'].forEach(p => {
      document.querySelectorAll('[data-pin="'+p+'"]').forEach(i => i.value = '');
    });
    document.getElementById('pinPanelErr').textContent = '';
  }

  async function submitPinChange() {
    const hasCurrent = document.querySelector('[data-pin="chg_current"]');
    const currentPin = hasCurrent ? getPin('chg_current') : null;
    const newPin     = getPin('chg_new');
    const confirmPin = getPin('chg_confirm');
    const errEl = document.getElementById('pinPanelErr');
    errEl.textContent = '';

    if (hasCurrent && currentPin.length < 4) { errEl.textContent = 'Enter your current 4-digit PIN.'; return; }
    if (newPin.length < 4)     { errEl.textContent = 'New PIN must be 4 digits.'; return; }
    if (confirmPin.length < 4) { errEl.textContent = 'Please confirm your new PIN.'; return; }
    if (newPin !== confirmPin) { errEl.textContent = 'New PINs do not match.'; return; }

    const btn = document.getElementById('updatePinBtn');
    btn.textContent = 'Updating…'; btn.disabled = true;

    try {
      const body = { ownerPhone: OWNER_PHONE, pin: currentPin || newPin, newPin };
      const r = await fetch(BACKEND_URL + '/api/public/owner/update/' + BIZ_ID, {
        method: 'PUT',
        body: (() => { const fd = new FormData(); Object.entries(body).forEach(([k,v]) => v && fd.append(k,v)); return fd; })()
      });
      const d = await r.json();
      if (!r.ok) { errEl.textContent = d.error || 'Failed to update PIN.'; btn.textContent = 'Update PIN'; btn.disabled = false; return; }
      closePinPanel();
      document.getElementById('changePinBtn').textContent = '✅ PIN Updated';
      document.getElementById('changePinBtn').style.color = 'var(--accent-color)';
    } catch(e) {
      errEl.textContent = 'Connection error. Please try again.';
      btn.textContent = 'Update PIN'; btn.disabled = false;
    }
  }
</script>
</script>`;

  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.send(shell(`Edit — ${esc(biz.name)}`, body, `/public/dir/${req.params.id}?phone=${encodeURIComponent(userPhone)}`, false));
});

/* ── POST /public/dir/:id/edit  (owner save edit) ── */
router.post('/:id/edit', async (req, res) => {
  const { phone: userPhone = '' } = req.query;
  const digits = String(userPhone).replace(/\D/g, '');
  let biz;
  try { biz = await Business.findById(req.params.id); } catch { biz = null; }
  if (!biz) return res.status(404).send('Not found');
  if (!digits || String(biz.ownerPhone).replace(/\D/g,'') !== digits) return res.status(403).send('Forbidden');

  const pin = String(req.body.pin || '').replace(/\D/g,'');
  if (!/^\d{4}$/.test(pin)) return res.redirect(`/public/dir/${req.params.id}/edit?phone=${encodeURIComponent(userPhone)}&err=pin`);

  const bcrypt = require('bcryptjs');
  /* If PIN is already set, verify current PIN */
  if (biz.ownerPin) {
    const ok = await bcrypt.compare(pin, biz.ownerPin);
    if (!ok) return res.redirect(`/public/dir/${req.params.id}/edit?phone=${encodeURIComponent(userPhone)}&err=wrongpin`);
  } else {
    /* No PIN set yet — treat the submitted pin as the new PIN to set */
    biz.ownerPin = await bcrypt.hash(pin, 10);
  }

  /* Handle PIN change */
  const newPin = String(req.body.newPin || '').replace(/\D/g,'');
  if (newPin && /^\d{4}$/.test(newPin)) {
    biz.ownerPin = await bcrypt.hash(newPin, 10);
  }

  const TEXT_FIELDS = ['name','description','category','subCategory','address','landmark','serviceLocations','city','pincode','phone','whatsappNo','landline','phone2','email','website','openTime','closeTime','infoQuestion','infoAnswer','fbLink','twitterLink','instaLink','googleMap','videoUrl'];
  for (const f of TEXT_FIELDS) {
    if (req.body[f] !== undefined) biz[f] = String(req.body[f]).trim();
  }
  const rawDays = req.body.openDays;
  biz.openDays = Array.isArray(rawDays) ? rawDays.join(',') : String(rawDays || '').trim();
  await biz.save();
  res.redirect(`/public/dir/${req.params.id}?phone=${encodeURIComponent(userPhone)}&saved=1`);
});

module.exports = router;
