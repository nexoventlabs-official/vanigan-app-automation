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
    <h1>🪔 Vanigan</h1>
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

  const listQ = `?district=${encodeURIComponent(district)}&assembly=${encodeURIComponent(assembly)}&category=${encodeURIComponent(category)}`;

  let cards = '';
  if (!businesses.length) {
    cards = `<div class="empty"><div class="icon">🔍</div><p>No businesses found for the selected filters.<br>Try changing the category or location.</p></div>`;
  } else {
    cards = businesses.map(b => {
      const imgTag = b.image
        ? `<img class="biz-card-img" src="${esc(b.image)}" alt="${esc(b.name)}" loading="lazy">`
        : `<div class="biz-card-no-img">🏪</div>`;
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
    <span class="chip">📍 ${esc(locLabel)}</span>
    <span class="chip">🏷️ ${esc(catLabel)}</span>
    <p style="font-size:.78rem;color:#9ca3af;margin-top:6px">${businesses.length} result${businesses.length !== 1 ? 's' : ''}</p>
  </div>
  ${cards}
</div>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(shell(pageTitle, body));
});

/* ── GET /public/dir/:id — business detail ── */
router.get('/:id', async (req, res) => {
  const { district = '', assembly = '', category = '' } = req.query;
  const backUrl = `/public/dir?district=${encodeURIComponent(district)}&assembly=${encodeURIComponent(assembly)}&category=${encodeURIComponent(category)}`;

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
    biz.phone      && ['📞', `<a href="tel:${esc(biz.phone)}">${esc(biz.phone)}</a>`],
    biz.whatsappNo && ['💬', `<a href="https://wa.me/${esc(biz.whatsappNo.replace(/\D/g,''))}" target="_blank">${esc(biz.whatsappNo)}</a>`],
    biz.landline   && ['☎️', esc(biz.landline)],
    biz.phone2     && ['📱', esc(biz.phone2)],
    biz.email      && ['✉️', `<a href="mailto:${esc(biz.email)}">${esc(biz.email)}</a>`],
    biz.website    && ['🌐', `<a href="${esc(biz.website)}" target="_blank">${esc(biz.website)}</a>`],
    biz.fbLink     && ['📘', `<a href="${esc(biz.fbLink)}" target="_blank">Facebook Page</a>`],
    biz.twitterLink && ['𝕏', `<a href="${esc(biz.twitterLink)}" target="_blank">Twitter / X</a>`],
    biz.instaLink  && ['📸', `<a href="${esc(biz.instaLink)}" target="_blank">Instagram</a>`],
    biz.googleMap  && ['🗺️', `<a href="${esc(biz.googleMap)}" target="_blank">Open in Google Maps</a>`],
    biz.videoUrl   && ['▶️', `<a href="${esc(biz.videoUrl)}" target="_blank">Watch Video</a>`],
  ].filter(Boolean);

  /* location section */
  const locRows = [
    biz.address  && ['📍', esc(biz.address)],
    biz.landmark && ['📌', esc(biz.landmark)],
    (biz.city || biz.pincode) && ['🏙️', esc([biz.city, biz.pincode].filter(Boolean).join(' – '))],
    biz.serviceLocations && ['🗺️', `Serves: ${esc(biz.serviceLocations)}`],
    (biz.lat && biz.lng) && ['📡', `<a href="https://maps.google.com/?q=${esc(biz.lat)},${esc(biz.lng)}" target="_blank">View on Map</a>`],
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

  const listQ = `?district=${encodeURIComponent(district)}&assembly=${encodeURIComponent(assembly)}&category=${encodeURIComponent(category)}`;

  const activeBadge = biz.active
    ? `<svg viewBox="0 0 24 24" width="20" height="20" style="display:inline-block;vertical-align:middle;margin-left:6px;flex-shrink:0" fill="currentColor" title="Verified active business"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.941.1-1.358.275C14.77 2.515 13.498 1.5 12 1.5s-2.77 1.015-3.412 2.285c-.417-.175-.878-.275-1.358-.275-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .941-.1 1.358-.275.642 1.27 1.914 2.285 3.412 2.285s2.77-1.015 3.412-2.285c.417.175.878.275 1.358.275 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z" fill="#0095F6"/><path d="M9.78 16.72l-3.86-3.86 1.41-1.41 2.45 2.45 6.18-6.18 1.41 1.41-7.59 7.59z" fill="white"/></svg>`
    : `<svg viewBox="0 0 24 24" width="20" height="20" style="display:inline-block;vertical-align:middle;margin-left:6px;flex-shrink:0" class="anim-pulse" fill="currentColor" title="Pending review"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.941.1-1.358.275C14.77 2.515 13.498 1.5 12 1.5s-2.77 1.015-3.412 2.285c-.417-.175-.878-.275-1.358-.275-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .941-.1 1.358-.275.642 1.27 1.914 2.285 3.412 2.285s2.77-1.015 3.412-2.285c.417.175.878.275 1.358.275 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z" fill="#F59E0B"/><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 9c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm.5-4H10V9h1v2h1.5v1z" fill="white"/></svg>`;

  const body = `<div class="wrap">
  ${submitted ? `<div class="toast">✅ Your review was submitted. Thank you!</div>` : ''}
  ${coverHtml}
  <div class="biz-title">${esc(biz.name)}${activeBadge}</div>
  <div class="biz-sub">${esc([biz.category, biz.subCategory].filter(Boolean).join(' › '))} &nbsp;|&nbsp; ${esc([biz.assembly, biz.district].filter(Boolean).join(', '))}</div>
  ${biz.description ? `<div class="section"><p style="font-size:.87rem;color:#d1d5db;line-height:1.6">${esc(biz.description)}</p></div>` : ''}

  ${locRows.length ? `<div class="section">
    <div class="sec-head">Location</div>
    ${locRows.map(([ic,v]) => `<div class="row-info"><span class="row-icon">${ic}</span><span class="row-val">${v}</span></div>`).join('')}
  </div>` : ''}

  ${contactRows.length ? `<div class="section">
    <div class="sec-head">Contact</div>
    ${contactRows.map(([ic,v]) => `<div class="row-info"><span class="row-icon">${ic}</span><span class="row-val">${v}</span></div>`).join('')}
  </div>` : ''}

  ${(daysHtml || timeHtml) ? `<div class="section">
    <div class="sec-head">Business Hours</div>
    ${daysHtml ? `<div style="margin-bottom:6px">${daysHtml}</div>` : ''}
    ${timeHtml ? `<div style="font-size:.85rem;color:#9ca3af">🕐 ${esc(timeHtml)}</div>` : ''}
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
    ${biz.infoQuestion ? `<div style="font-weight:700;font-size:.88rem;color:#ffffff;margin-bottom:5px">❓ ${esc(biz.infoQuestion)}</div>` : ''}
    ${biz.infoAnswer ? `<div style="font-size:.83rem;color:#d1d5db">${esc(biz.infoAnswer)}</div>` : ''}
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
      <input type="text" name="reviewerName" required placeholder="Enter your name">
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
