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
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff7ed;min-height:100vh}
.top-bar{background:#7c2d12;color:#fff;padding:12px 16px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:10}
.top-bar a{color:#fca5a5;text-decoration:none;font-size:.85rem}
.top-bar h1{font-size:1rem;font-weight:700;flex:1}
.top-bar p{font-size:.75rem;color:#fde8d8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px}
.wrap{max-width:600px;margin:0 auto;padding:16px}
.chip{display:inline-block;background:#fde8d8;color:#9a3412;border-radius:20px;padding:3px 10px;font-size:.72rem;font-weight:600;margin-bottom:6px}
.biz-card{background:#fff;border-radius:16px;box-shadow:0 2px 10px rgba(0,0,0,.07);margin-bottom:14px;overflow:hidden;display:flex;align-items:stretch}
.biz-card-img{width:90px;min-height:90px;object-fit:cover;flex-shrink:0}
.biz-card-no-img{width:90px;min-height:90px;background:#fde8d8;display:flex;align-items:center;justify-content:center;font-size:2rem;flex-shrink:0}
.biz-card-body{padding:12px 14px;flex:1;min-width:0}
.biz-name{font-size:.95rem;font-weight:700;color:#1a1a1a;margin-bottom:3px}
.biz-cat{font-size:.75rem;color:#c2410c;font-weight:600;margin-bottom:5px}
.biz-desc{font-size:.78rem;color:#555;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.biz-phone{font-size:.8rem;color:#374151}
.biz-phone a{color:#c2410c;text-decoration:none;font-weight:600}
.view-btn{display:block;text-align:center;background:#c2410c;color:#fff;border-radius:0 0 16px 16px;padding:9px;font-size:.85rem;font-weight:600;text-decoration:none}
.view-btn:hover{background:#9a3412}
.empty{text-align:center;padding:48px 16px;color:#888}
.empty .icon{font-size:48px;margin-bottom:12px}
/* detail */
.cover{width:100%;height:160px;object-fit:cover;border-radius:16px;margin-bottom:16px}
.biz-title{font-size:1.3rem;font-weight:700;color:#1a1a1a;margin-bottom:4px}
.biz-sub{font-size:.85rem;color:#888;margin-bottom:14px}
.section{background:#fff;border-radius:14px;box-shadow:0 1px 8px rgba(0,0,0,.06);padding:16px;margin-bottom:14px}
.sec-head{font-size:.72rem;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;padding-bottom:6px;border-bottom:1.5px solid #fde8d8}
.row-info{display:flex;gap:10px;padding:7px 0;border-bottom:1px solid #f3f4f6}
.row-info:last-child{border-bottom:none}
.row-icon{font-size:1rem;width:22px;flex-shrink:0;margin-top:1px}
.row-val{font-size:.85rem;color:#374151;word-break:break-word}
.row-val a{color:#c2410c;text-decoration:none;font-weight:600}
.svc-item{display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #f3f4f6}
.svc-item:last-child{border-bottom:none}
.svc-img{width:52px;height:52px;object-fit:cover;border-radius:8px;flex-shrink:0}
.svc-name{font-weight:700;font-size:.85rem;color:#1a1a1a}
.svc-price{font-size:.8rem;color:#c2410c;font-weight:600}
.svc-detail{font-size:.78rem;color:#666}
.gallery-grid{display:flex;flex-wrap:wrap;gap:8px}
.gallery-grid img{width:80px;height:80px;object-fit:cover;border-radius:10px;cursor:pointer}
.rev-item{padding:10px 0;border-bottom:1px solid #f3f4f6}
.rev-item:last-child{border-bottom:none}
.rev-stars{color:#f59e0b;font-size:1rem}
.rev-name{font-weight:600;font-size:.82rem;color:#374151;margin-left:6px}
.rev-text{font-size:.82rem;color:#555;margin-top:4px}
.avg-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.avg-num{font-size:2rem;font-weight:700;color:#1a1a1a}
.avg-label{font-size:.8rem;color:#888}
label{display:block;font-size:.78rem;font-weight:600;color:#374151;margin-bottom:4px}
input,textarea,select{width:100%;border:1.5px solid #d1d5db;border-radius:10px;padding:9px 12px;font-size:.9rem;outline:none;background:#fff;margin-bottom:12px}
input:focus,textarea:focus,select:focus{border-color:#c2410c}
textarea{resize:vertical}
.submit-btn{width:100%;background:#c2410c;color:#fff;font-weight:600;padding:12px;border-radius:12px;border:none;font-size:.95rem;cursor:pointer}
.submit-btn:hover{background:#9a3412}
.days-tag{display:inline-block;background:#fde8d8;color:#9a3412;border-radius:6px;padding:2px 7px;font-size:.72rem;font-weight:600;margin:2px}
.toast{background:#166534;color:#fff;border-radius:10px;padding:10px 14px;font-size:.85rem;margin-bottom:12px}
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
  return '★'.repeat(full) + '☆'.repeat(5 - full);
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
      return `<div class="biz-card">
  <div style="display:flex;align-items:stretch;width:100%">
    ${imgTag}
    <div class="biz-card-body">
      <div class="biz-name">${esc(b.name)}</div>
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
    <p style="font-size:.78rem;color:#888;margin-top:6px">${businesses.length} result${businesses.length !== 1 ? 's' : ''}</p>
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

  const body = `<div class="wrap">
  ${submitted ? `<div class="toast">✅ Your review was submitted. Thank you!</div>` : ''}
  ${coverHtml}
  <div class="biz-title">${esc(biz.name)}</div>
  <div class="biz-sub">${esc([biz.category, biz.subCategory].filter(Boolean).join(' › '))} &nbsp;|&nbsp; ${esc([biz.assembly, biz.district].filter(Boolean).join(', '))}</div>
  ${biz.description ? `<div class="section"><p style="font-size:.87rem;color:#374151;line-height:1.6">${esc(biz.description)}</p></div>` : ''}

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
    ${timeHtml ? `<div style="font-size:.85rem;color:#374151">🕐 ${esc(timeHtml)}</div>` : ''}
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
    ${biz.infoQuestion ? `<div style="font-weight:600;font-size:.85rem;color:#1a1a1a;margin-bottom:5px">❓ ${esc(biz.infoQuestion)}</div>` : ''}
    ${biz.infoAnswer ? `<div style="font-size:.83rem;color:#555">${esc(biz.infoAnswer)}</div>` : ''}
  </div>` : ''}

  <div class="section">
    <div class="sec-head">Reviews & Ratings</div>
    ${total > 0 ? `<div class="avg-row">
      <div class="avg-num">${avg.toFixed(1)}</div>
      <div>
        <div style="color:#f59e0b;font-size:1.1rem">${stars(avg)}</div>
        <div class="avg-label">${total} review${total !== 1 ? 's' : ''}</div>
      </div>
    </div>` : `<p style="font-size:.82rem;color:#888;margin-bottom:10px">No reviews yet — be the first!</p>`}
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
