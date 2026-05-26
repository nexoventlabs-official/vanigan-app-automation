const express = require('express');
const multer = require('multer');
const { uploadBuffer } = require('../services/cloudinary');
const { uploadBuffer: bizUpload } = require('../services/businessCloudinary');
const districts = require('../services/districts');
const Business = require('../models/Business');
const meta = require('../services/metaCloud');
const generateListingCode = require('../utils/generateListingCode');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const uploadFields = upload.fields([
  { name: 'image',        maxCount: 1 },
  { name: 'coverImage',   maxCount: 1 },
  { name: 'galleryImages', maxCount: 10 },
  ...Array.from({ length: 6 }, (_, i) => ({ name: `service${i + 1}Image`, maxCount: 1 })),
]);

/* ── Public: district map (no auth) ── */
router.get('/districts', (_req, res) => {
  res.json({ map: districts.getMap() });
});

/* ── Registration form HTML ── */
router.get('/register', async (req, res) => {
  const phone = String(req.query.phone || '').replace(/\D/g, '');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (phone) {
    const existing = await Business.findOne({ ownerPhone: phone }).lean().catch(() => null);
    if (existing) {
      return res.send(pageShell('Already Registered', `
        <div class="icon">🏪</div>
        <h1>Already Registered!</h1>
        <p><strong>${escHtml(existing.name)}</strong> is already registered on Vanigan.</p>
        <p class="sub">Our team will review and activate your listing shortly.<br>You'll receive a WhatsApp confirmation once approved. 🙏</p>
      `));
    }
  }

  res.send(buildFormHtml(phone));
});

/* ── Handle form submission ── */
router.post('/register', uploadFields, async (req, res) => {
  try {
    const { name, category, subCategory, description, district, assembly, address,
            phone, whatsappNo, landline, ownerPhone, phone2, email, website, landmark,
            serviceLocations, city, pincode, openTime, closeTime, lat, lng,
            fbLink, twitterLink, instaLink, googleMap, videoUrl, infoQuestion, infoAnswer,
            service1Name, service1Price, service1Detail,
            service2Name, service2Price, service2Detail,
            service3Name, service3Price, service3Detail,
            service4Name, service4Price, service4Detail,
            service5Name, service5Price, service5Detail,
            service6Name, service6Price, service6Detail } = req.body;

    if (!name || !address) {
      return res.status(400).setHeader('Content-Type', 'text/html').send(
        pageShell('Missing Fields', `<div class="icon">⚠️</div><h1>Missing Required Fields</h1><p>Please go back and fill in Business Name and Address.</p><a href="javascript:history.back()" class="btn">Go Back</a>`)
      );
    }

    /* openDays checkboxes come as array or single string */
    const rawDays = req.body.openDays;
    const openDays = Array.isArray(rawDays) ? rawDays.join(',') : (rawDays || '');

    const doc = {
      name:             name.trim(),
      category:         (category || '').trim(),
      subCategory:      (subCategory || '').trim(),
      description:      (description || '').trim(),
      district:         (district || '').trim(),
      assembly:         (assembly || '').trim(),
      address:          (address || '').trim(),
      landmark:         (landmark || '').trim(),
      serviceLocations: (serviceLocations || '').trim(),
      city:             (city || '').trim(),
      pincode:          (pincode || '').trim(),
      phone:            (phone || '').trim(),
      whatsappNo:       (whatsappNo || '').trim(),
      landline:         (landline || '').trim(),
      phone2:           (phone2 || '').trim(),
      email:            (email || '').trim(),
      website:          (website || '').trim(),
      fbLink:           (fbLink || '').trim(),
      twitterLink:      (twitterLink || '').trim(),
      instaLink:        (instaLink || '').trim(),
      googleMap:        (googleMap || '').trim(),
      videoUrl:         (videoUrl || '').trim(),
      openDays,
      openTime:         (openTime || '').trim(),
      closeTime:        (closeTime || '').trim(),
      lat:              (lat || '').trim(),
      lng:              (lng || '').trim(),
      infoQuestion:     (infoQuestion || '').trim(),
      infoAnswer:       (infoAnswer || '').trim(),
      ownerPhone:       (ownerPhone || '').trim(),
      active:           false,
    };

    /* ── Profile image ── */
    if (req.body.croppedImage && req.body.croppedImage.startsWith('data:image')) {
      const base64Data = req.body.croppedImage.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const result = await bizUpload(buffer, { folder: 'vanigan_biz' });
      doc.image = result.secure_url;
      doc.imagePublicId = result.public_id;
    } else if (req.files?.image?.[0]) {
      const result = await bizUpload(req.files.image[0].buffer, { folder: 'vanigan_biz' });
      doc.image = result.secure_url;
      doc.imagePublicId = result.public_id;
    }

    /* ── Cover image ── */
    if (req.files?.coverImage?.[0]) {
      const result = await bizUpload(req.files.coverImage[0].buffer, { folder: 'vanigan_biz' });
      doc.coverImage = result.secure_url;
      doc.coverImagePublicId = result.public_id;
    }

    /* ── Gallery images ── */
    if (req.files?.galleryImages?.length) {
      doc.galleryImages = await Promise.all(
        req.files.galleryImages.map(async (f) => {
          const r = await bizUpload(f.buffer, { folder: 'vanigan_biz' });
          return { url: r.secure_url, publicId: r.public_id };
        })
      );
    }

    /* ── Services ── */
    const svcNames   = [service1Name,service2Name,service3Name,service4Name,service5Name,service6Name];
    const svcPrices  = [service1Price,service2Price,service3Price,service4Price,service5Price,service6Price];
    const svcDetails = [service1Detail,service2Detail,service3Detail,service4Detail,service5Detail,service6Detail];
    const services = [];
    for (let i = 0; i < 6; i++) {
      const n = (svcNames[i] || '').trim();
      const p = (svcPrices[i] || '').trim();
      const d = (svcDetails[i] || '').trim();
      let img = '', imgId = '';
      const imgFile = req.files?.[`service${i + 1}Image`]?.[0];
      if (imgFile) {
        const r = await bizUpload(imgFile.buffer, { folder: 'vanigan_biz' });
        img = r.secure_url; imgId = r.public_id;
      }
      if (n || p || d || img) services.push({ name: n, price: p, detail: d, image: img, imagePublicId: imgId });
    }
    if (services.length) doc.services = services;

    doc.listingCode = await generateListingCode();
    await Business.create(doc);

    if (doc.ownerPhone) {
      meta.sendText(
        doc.ownerPhone,
        `✅ *${doc.name}* has been submitted for listing on Vanigan!\n\n📋 Your Listing Code: *${doc.listingCode}*\n\nOur team will review and activate your business shortly.\n\nThank you 🙏`
      ).catch(() => {});
    }

    res.setHeader('Content-Type', 'text/html').send(
      pageShell('Registration Successful', `
        <div class="icon">✅</div>
        <h1>Registration Submitted!</h1>
        <p><strong>${escHtml(doc.name)}</strong> has been submitted for listing on Vanigan.</p>
        <p style="margin-top:14px">Your Listing Code: <strong>${escHtml(doc.listingCode)}</strong></p>
        <p class="sub">Our team will review and activate your listing shortly.<br>You'll receive a WhatsApp confirmation. 🙏</p>
      `)
    );
  } catch (err) {
    console.error('[publicRegister] error:', err.message);
    res.status(500).setHeader('Content-Type', 'text/html').send(
      pageShell('Error', `<div class="icon">❌</div><h1>Something went wrong</h1><p>${escHtml(err.message)}</p><a href="javascript:history.back()" class="btn">Go Back</a>`)
    );
  }
});

/* ── Helpers ── */
function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function pageShell(title, bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(title)} — Vanigan</title>
  <style>
    :root {
      --bg-color: #000000;
      --card-bg: #0A0E17;
      --card-border: rgba(255,255,255,0.08);
      --text-main: #ffffff;
      --text-muted: #9ca3af;
      --accent-color: #66ff4c;
      --accent-hover: #52e038;
      --accent-rgb: 102, 255, 76;
      --topbar-bg: rgba(10, 14, 23, 0.85);
      --topbar-border: rgba(255, 255, 255, 0.08);
      --theme-btn-bg: rgba(255, 255, 255, 0.05);
    }
    [data-theme="light"] {
      --bg-color: #f9fafb;
      --card-bg: #ffffff;
      --card-border: rgba(0,0,0,0.08);
      --text-main: #111827;
      --text-muted: #4b5563;
      --accent-color: #16a34a;
      --accent-hover: #15803d;
      --accent-rgb: 22, 163, 74;
      --topbar-bg: rgba(255, 255, 255, 0.9);
      --topbar-border: rgba(0, 0, 0, 0.08);
      --theme-btn-bg: rgba(0, 0, 0, 0.05);
    }
    *{box-sizing:border-box;margin:0;padding:0}
    body{
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      background-color:var(--bg-color);
      color:var(--text-main);
      min-height:100vh;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      padding:80px 24px 24px;
    }
    .top-bar{
      position:fixed;
      top:0;
      left:0;
      right:0;
      background:var(--topbar-bg);
      backdrop-filter:blur(12px);
      -webkit-backdrop-filter:blur(12px);
      border-bottom:1px solid var(--topbar-border);
      padding:14px 24px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      z-index:1000;
    }
    .theme-toggle{
      background:none;
      border:none;
      color:var(--text-main);
      cursor:pointer;
      padding:8px;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      transition:all 0.2s;
      width:36px;
      height:36px;
    }
    .theme-toggle:hover{
      background:var(--theme-btn-bg);
      transform:scale(1.05);
    }
    .card{
      background:var(--card-bg);
      border:1px solid var(--card-border);
      border-radius:24px;
      box-shadow:0 12px 40px rgba(0,0,0,0.5);
      padding:48px 40px;
      max-width:480px;
      width:100%;
      text-align:center;
    }
    .icon{margin-bottom:20px;filter:drop-shadow(0 0 10px rgba(var(--accent-rgb),0.25))}
    h1{font-size:1.8rem;color:var(--text-main);margin-bottom:14px;font-weight:900;letter-spacing:-0.02em}
    p{color:var(--text-muted);line-height:1.65;margin-bottom:8px;font-size:0.92rem;font-weight:500}
    p.sub{font-size:0.85rem;color:var(--text-muted);opacity:0.8;margin-top:16px;border-top:1px solid var(--card-border);padding-top:16px}
    strong{color:var(--text-main);font-weight:700}
    .btn{
      display:inline-block;
      margin-top:24px;
      padding:12px 28px;
      background:var(--accent-color);
      color:rgba(0,0,0,0.9);
      text-decoration:none;
      border-radius:12px;
      font-weight:850;
      font-size:0.85rem;
      text-transform:uppercase;
      letter-spacing:0.05em;
      transition:all 0.2s;
      box-shadow:0 0 15px rgba(var(--accent-rgb),0.3);
    }
    [data-theme="light"] .btn{color:#ffffff}
    .btn:hover{background:var(--accent-hover);transform:translateY(-1px)}
  </style>
  <script>
    (function() {
      const savedTheme = localStorage.getItem('vanigan-theme') || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
    })();
  </script>
</head>
<body>
  <div class="top-bar">
    <div style="display:flex;align-items:center;gap:12px">
      <img src="https://vanigan.org/front/images/home/tnvslogo.png" alt="Vanigan" style="height:28px;width:auto">
    </div>
    <button id="themeToggleBtn" class="theme-toggle" aria-label="Toggle Theme">
      <!-- Sun (shows in Light theme to switch to Dark) -->
      <svg class="sun-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
      <!-- Moon (shows in Dark theme to switch to Light) -->
      <svg class="moon-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
    </button>
  </div>
  <div class="card">${bodyContent}</div>
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

function buildFormHtml(phone) {
  const backendUrl = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Register Your Business — Vanigan</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css">
  <style>
    :root {
      --bg-color: #000000;
      --bg-image: radial-gradient(rgba(102,255,76,0.04) 1.5px, transparent 1.5px);
      --bg-spotlight: radial-gradient(circle at top, rgba(102,255,76,0.07) 0%, transparent 70%);
      --card-bg: #0A0E17;
      --card-border: rgba(255,255,255,0.08);
      --text-main: #ffffff;
      --text-muted: #9ca3af;
      --input-bg: rgba(0,0,0,0.65);
      --input-border: rgba(255,255,255,0.08);
      --accent-color: #66ff4c;
      --accent-hover: #52e038;
      --accent-rgb: 102, 255, 76;
      --topbar-bg: rgba(10, 14, 23, 0.85);
      --topbar-border: rgba(255, 255, 255, 0.08);
      --theme-btn-bg: rgba(255, 255, 255, 0.05);
      --svc-card-bg: rgba(255,255,255,0.02);
      --svc-card-border: rgba(255,255,255,0.06);
    }
    [data-theme="light"] {
      --bg-color: #f9fafb;
      --bg-image: radial-gradient(rgba(22,163,74,0.05) 1.5px, transparent 1.5px);
      --bg-spotlight: radial-gradient(circle at top, rgba(22,163,74,0.06) 0%, transparent 70%);
      --card-bg: #ffffff;
      --card-border: rgba(0,0,0,0.08);
      --text-main: #111827;
      --text-muted: #4b5563;
      --input-bg: #ffffff;
      --input-border: rgba(0,0,0,0.12);
      --accent-color: #16a34a;
      --accent-hover: #15803d;
      --accent-rgb: 22, 163, 74;
      --topbar-bg: rgba(255, 255, 255, 0.9);
      --topbar-border: rgba(0, 0, 0, 0.08);
      --theme-btn-bg: rgba(0, 0, 0, 0.05);
      --svc-card-bg: rgba(0,0,0,0.02);
      --svc-card-border: rgba(0,0,0,0.06);
    }
    *{box-sizing:border-box;margin:0;padding:0}
    body{
      font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color:var(--bg-color);
      background-image:var(--bg-image);
      background-size:24px 24px;
      min-height:100vh;
      color:var(--text-main);
      padding:96px 16px 32px;
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
      position:fixed;
      top:0;
      left:0;
      right:0;
      background:var(--topbar-bg);
      backdrop-filter:blur(12px);
      -webkit-backdrop-filter:blur(12px);
      border-bottom:1px solid var(--topbar-border);
      padding:14px 24px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      z-index:1000;
    }
    .theme-toggle{
      background:none;
      border:none;
      color:var(--text-main);
      cursor:pointer;
      padding:8px;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      transition:all 0.2s;
      width:36px;
      height:36px;
    }
    .theme-toggle:hover{
      background:var(--theme-btn-bg);
      transform:scale(1.05);
    }
    .wrap{max-width:560px;margin:0 auto;position:relative;z-index:1}
    .header{text-align:center;margin-bottom:24px}
    .header h1{font-size:1.8rem;font-weight:900;color:var(--text-main);letter-spacing:-0.02em}
    .header p{font-size:.9rem;color:var(--text-muted);margin-top:6px;font-weight:600}
    .card{background:var(--card-bg);border:1px solid var(--card-border);border-radius:24px;box-shadow:0 8px 32px rgba(0,0,0,0.4);padding:32px 24px;margin-bottom:20px}
    label{display:block;font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:6px}
    .req{color:#ef4444}
    input,select,textarea{width:100%;border:1px solid var(--input-border);border-radius:12px;padding:11px 14px;font-size:.9rem;outline:none;background:var(--input-bg);color:var(--text-main);transition:all .25s}
    input:focus,select:focus,textarea:focus{border-color:var(--accent-color);box-shadow:0 0 10px rgba(var(--accent-rgb),0.15)}
    textarea{resize:vertical}
    .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    @media(max-width:480px){.row{grid-template-columns:1fr}}
    .field{margin-bottom:16px}
    
    select{
      appearance: none;
      background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2366ff4c' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
      background-position: right 0.75rem center;
      background-size: 1.25rem;
      background-repeat: no-repeat;
      padding-right: 2.5rem;
    }
    [data-theme="light"] select {
      background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2316a34a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
    }
    select option{
      background-color: var(--card-bg);
      color: var(--text-main);
    }
    
    .img-upload-btn{width:100%;border:2px dashed var(--input-border);border-radius:14px;padding:24px;text-align:center;font-size:.85rem;color:var(--text-muted);cursor:pointer;transition:all .2s;background:rgba(255,255,255,0.01)}
    .img-upload-btn:hover{border-color:var(--accent-color);color:var(--accent-color);background:rgba(var(--accent-rgb),0.02)}
    .crop-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(4px);z-index:9999;flex-direction:column;align-items:center;justify-content:center;padding:16px}
    .crop-modal.active{display:flex}
    .crop-box{background:var(--card-bg);border:1px solid var(--card-border);border-radius:24px;padding:24px;width:100%;max-width:480px;box-shadow:0 20px 50px rgba(0,0,0,0.6)}
    .crop-box h2{font-size:1.1rem;font-weight:900;margin-bottom:16px;color:var(--text-main);letter-spacing:-0.01em}
    .crop-img-wrap{max-height:55vh;overflow:hidden;border-radius:12px;background:#000;border:1px solid var(--card-border)}
    .crop-img-wrap img{display:block;max-width:100%}
    .crop-actions{display:flex;gap:12px;margin-top:16px}
    .crop-actions button{flex:1;padding:12px;border-radius:12px;font-weight:850;font-size:.85rem;text-transform:uppercase;letter-spacing:0.05em;border:none;cursor:pointer;transition:all 0.2s}
    .btn-crop{background:var(--accent-color);color:rgba(0,0,0,0.9);box-shadow:0 0 10px rgba(var(--accent-rgb),0.2)}
    [data-theme="light"] .btn-crop{color:#ffffff}
    .btn-crop:hover{background:var(--accent-hover);transform:translateY(-1px)}
    .btn-cancel{background:rgba(255,255,255,0.05);color:var(--text-main);border:1px solid var(--card-border)}
    .btn-cancel:hover{background:rgba(255,255,255,0.08)}
    .preview-wrap{display:none;margin-bottom:10px}
    .preview-wrap img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:14px;border:1px solid var(--card-border);margin-bottom:12px}

    .submit-btn{width:100%;background:var(--accent-color);color:rgba(0,0,0,0.9);font-weight:850;padding:14px;border-radius:14px;border:none;font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;cursor:pointer;transition:all .2s;box-shadow:0 0 15px rgba(var(--accent-rgb),0.25)}
    [data-theme="light"] .submit-btn{color:#ffffff}
    .submit-btn:hover{background:var(--accent-hover);transform:translateY(-1px);box-shadow:0 0 20px rgba(var(--accent-rgb),0.35)}
    .submit-btn:disabled{background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.05);cursor:not-allowed;box-shadow:none}
    .note{text-align:center;font-size:.75rem;color:var(--text-muted);margin-top:16px}
    .sec-title{font-size:10px;font-weight:900;color:var(--accent-color);text-transform:uppercase;letter-spacing:.08em;margin-top:20px;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid rgba(var(--accent-rgb),0.15)}
    .svc-card{background:var(--svc-card-bg);border:1px solid var(--svc-card-border);border-radius:14px;padding:16px;margin-bottom:16px;transition:all .2s}
    .svc-card:hover{border-color:rgba(var(--accent-rgb),0.15)}
    .img-thumb{width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid var(--card-border)}
    .gallery-preview{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
    .gallery-preview img{width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid var(--card-border)}
    
    .add-dyn-btn{width:100%;padding:12px;background:rgba(var(--accent-rgb),0.02);color:var(--accent-color);border:1px dashed rgba(var(--accent-rgb),0.3);border-radius:12px;font-size:.85rem;font-weight:700;cursor:pointer;margin:0 0 20px;text-align:center;display:block;transition:all .2s}
    .add-dyn-btn:hover{background:rgba(var(--accent-rgb),0.05);border-color:var(--accent-color)}
    .social-item{display:flex;align-items:center;gap:8px;margin-bottom:10px}
    .social-item .s-label{font-size:10px;font-weight:800;color:var(--text-muted);width:110px;min-width:110px;text-transform:uppercase;letter-spacing:0.05em}
    .social-item input{flex:1;margin:0}
    .social-item .rm-btn{background:none;border:none;color:#ef4444;font-size:1.3rem;cursor:pointer;padding:0 4px;line-height:1;flex-shrink:0;transition:transform .2s}
    .social-item .rm-btn:hover{transform:scale(1.15)}
    .svc-num{font-size:10px;font-weight:900;color:var(--accent-color);margin-bottom:12px;text-transform:uppercase;letter-spacing:.05em;display:flex;justify-content:space-between;align-items:center}
    .svc-rm{background:none;border:none;color:#ef4444;font-size:10px;font-weight:850;cursor:pointer;padding:0;text-transform:uppercase;letter-spacing:0.05em}
    
    #daysWrap{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
    #daysWrap label {
      display: inline-flex !important;
      align-items: center;
      gap: 6px;
      font-weight: 600 !important;
      font-size: .8rem !important;
      cursor: pointer;
      padding: 6px 12px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      color: var(--text-muted) !important;
      transition: all 0.2s;
      margin: 2px;
      text-transform: none !important;
      letter-spacing: 0 !important;
    }
    #daysWrap label:has(input:checked) {
      background: rgba(var(--accent-rgb), 0.1) !important;
      border-color: var(--accent-color) !important;
      color: var(--accent-color) !important;
      box-shadow: 0 0 8px rgba(var(--accent-rgb), 0.15);
    }
    #daysWrap input[type=checkbox] {
      width: 13px !important;
      height: 13px !important;
      accent-color: var(--accent-color) !important;
      cursor: pointer;
    }
  </style>
  <script>
    (function() {
      const savedTheme = localStorage.getItem('vanigan-theme') || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
    })();
  </script>
</head>
<body>
  <div class="top-bar">
    <div style="display:flex;align-items:center;gap:12px">
      <img src="https://vanigan.org/front/images/home/tnvslogo.png" alt="Vanigan" style="height:28px;width:auto">
    </div>
    <button id="themeToggleBtn" class="theme-toggle" aria-label="Toggle Theme">
      <!-- Sun (shows in Light theme to switch to Dark) -->
      <svg class="sun-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
      <!-- Moon (shows in Dark theme to switch to Light) -->
      <svg class="moon-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
    </button>
  </div>
  <div class="wrap">
  <div class="header">
    <div class="icon"><img src="https://vanigan.org/front/images/home/tnvslogo.png" alt="Vanigan" style="height:48px;width:auto"></div>
    <h1>Vanigan</h1>
    <p>Register Your Business</p>
  </div>

  <form id="regForm" method="POST" action="${backendUrl}/public/register" enctype="multipart/form-data">
    <div class="card">
      <input type="hidden" name="ownerPhone" value="${escHtml(phone)}">

      <div class="field">
        <label>Business Name <span class="req">*</span></label>
        <input type="text" name="name" required placeholder="e.g. Sri Lakshmi Stores">
      </div>

      <div class="row field">
        <div>
          <label>Category</label>
          <select name="category">
            <option value="">— Select Category —</option>
            ${['Emart','Hospitals','Transport','Electricals','Education','Sports','Real Estate','Spa and Facial','Digital Products','Anything on Hire','Automobile','B2B','Banquets','Bills & Recharge','Books','Cabs & Car rentals','Caterers','Civil Contractors','Courier','Daily Needs','Art & Artists','Doctor','Jobs','Jewellery','Labs','Language Classes','Bank','Medical','Modular Kitchen','Home Service','Packers and Movers','Party','Personal Care','Pest Control','Pet and Pet Care','Play School','Sports Goods','Training Institute','Transporters','Travel','Wedding','Auditor','Advocate','Cinema','Printing Services','Textiles','Photo Studio','Online service','Manufacturer','Export Import','Retailer and Stationery','Engineering','Distributor','Organic Products','Hotel and Restaurant','Online Ticket Booking','Advertising','Food Stall','IT And Software','All Shops','Repairs','Home Appliance','Demand Service','Spices','Butcher shop','TOURISM','Construction Materials','Insurance','Customs House','Shopping','Hostel and Mansion','AGRICULTURE','RELIGIOUS'].map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>Sub-Category</label>
          <input type="text" name="subCategory" placeholder="e.g. Fast Food, Wholesale">
        </div>
      </div>

      <div class="field">
        <label>Description</label>
        <textarea name="description" rows="3" placeholder="Brief description of your business"></textarea>
      </div>

      <div class="row field">
        <div>
          <label>District <span class="req">*</span></label>
          <select name="district" id="districtSel" required>
            <option value="">Loading…</option>
          </select>
        </div>
        <div>
          <label>Assembly <span class="req">*</span></label>
          <select name="assembly" id="assemblySel" required>
            <option value="">Select district first</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label style="display:flex;justify-content:space-between;align-items:center">
          <span>Address <span class="req">*</span></span>
          <button type="button" id="locBtn" onclick="useMyLocation()" style="background:none;border:none;color:#66ff4c;font-size:.8rem;font-weight:700;cursor:pointer;padding:0;transition:all 0.2s">📍 Use Current Location</button>
        </label>
        <textarea name="address" id="addressField" rows="2" required placeholder="Full address of your business"></textarea>
        <input type="hidden" name="lat" id="latField">
        <input type="hidden" name="lng" id="lngField">
        <div id="locStatus" style="font-size:.75rem;color:#9ca3af;margin-top:3px"></div>
      </div>

      <div class="field">
        <label>Landmark / How to Reach</label>
        <input type="text" name="landmark" placeholder="e.g. Near bus stand, opposite post office">
      </div>

      <div class="field">
        <label>Areas / Service Locations</label>
        <input type="text" name="serviceLocations" placeholder="Areas you serve, e.g. Anna Nagar, T. Nagar">
      </div>

      <div class="row field">
        <div>
          <label>City</label>
          <input type="text" name="city" placeholder="e.g. Chennai">
        </div>
        <div>
          <label>Pincode</label>
          <input type="text" name="pincode" placeholder="6-digit PIN" maxlength="6" inputmode="numeric">
        </div>
      </div>

      <div class="sec-title" style="margin-top:4px">Contact</div>

      <div class="field">
        <label>WhatsApp / Primary Phone <span class="req">*</span></label>
        <input type="tel" name="phone" value="${escHtml(phone)}" style="background:#f3f4f6;color:#6b7280;cursor:not-allowed" readonly>
      </div>

      <div class="row field">
        <div>
          <label>WhatsApp No</label>
          <input type="tel" name="whatsappNo" value="${escHtml(phone)}" placeholder="WhatsApp number">
        </div>
        <div>
          <label>Landline</label>
          <input type="tel" name="landline" placeholder="STD code + number">
        </div>
      </div>

      <div class="row field">
        <div>
          <label>Alternate Phone</label>
          <input type="tel" name="phone2" placeholder="Second mobile">
        </div>
        <div>
          <label>Email</label>
          <input type="email" name="email" placeholder="business@example.com">
        </div>
      </div>

      <div class="field">
        <label>Website</label>
        <input type="url" name="website" placeholder="https://...">
      </div>

      <div class="sec-title" style="margin-top:4px">Social &amp; Media</div>
      <div id="socialRows"></div>
      <button type="button" id="addSocialBtn" class="add-dyn-btn">+ Add Social Media</button>

      <div class="field">
        <label>Opening Days</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px" id="daysWrap">
          ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d =>
            `<label style="display:flex;align-items:center;gap:4px;font-weight:400;font-size:.85rem;cursor:pointer">
              <input type="checkbox" name="openDays" value="${d}" style="width:auto;border:none;padding:0"> ${d}
            </label>`).join('')}
        </div>
      </div>

      <div class="row field">
        <div>
          <label>Opening Time</label>
          <input type="time" name="openTime">
        </div>
        <div>
          <label>Closing Time</label>
          <input type="time" name="closeTime">
        </div>
      </div>

      <div class="sec-title" style="margin-top:4px">FAQ <span style="font-weight:400;text-transform:none;font-size:.7rem;color:#888">(optional)</span></div>

      <div class="field">
        <label>Frequently Asked Question</label>
        <input type="text" name="infoQuestion" placeholder="e.g. Do you offer home delivery?">
      </div>

      <div class="field">
        <label>Answer</label>
        <textarea name="infoAnswer" rows="2" placeholder="Your answer to the above question"></textarea>
      </div>

      <div class="sec-title" style="margin-top:4px">Cover / Banner Image <span style="font-weight:400;text-transform:none;font-size:.7rem;color:#888">(optional)</span></div>

      <div class="field">
        <label>Cover / Banner Photo <span style="color:#888;font-weight:400">(banner ratio — crops to fit)</span></label>
        <input type="file" name="coverImage" id="coverImageInput" accept="image/*" style="display:none">
        <div id="coverPreview" style="display:none;margin-bottom:10px">
          <img id="coverPreviewImg" style="width:100%;height:110px;object-fit:cover;border-radius:10px;border:1.5px solid #e5e7eb">
        </div>
        <button type="button" class="img-upload-btn" onclick="document.getElementById('coverImageInput').click()">
          🖼️ Tap to upload cover / banner photo
        </button>
        <p style="font-size:.75rem;color:#9ca3af;margin-top:5px">Banner width × 5:1 ratio • JPG, PNG, WebP • max 5 MB</p>
      </div>

      <div class="sec-title" style="margin-top:4px">Gallery Images <span style="font-weight:400;text-transform:none;font-size:.7rem;color:#888">(optional — up to 10)</span></div>

      <div class="field">
        <label>Upload multiple photos of your business</label>
        <input type="file" name="galleryImages" id="galleryInput" accept="image/*" multiple>
        <div class="gallery-preview" id="galleryPreview"></div>
      </div>

      <div class="sec-title" style="margin-top:4px">Services / Products <span style="font-weight:400;text-transform:none;font-size:.7rem;color:#888">(optional — up to 6)</span></div>
      <div id="svcContainer"></div>
      <button type="button" id="addSvcBtn" class="add-dyn-btn" onclick="addSvc()">+ Add Service</button>

      <div class="sec-title" style="margin-top:4px">Profile Photo</div>

      <div class="field">
        <label>Business Photo <span style="color:#888;font-weight:400">(1:1 square)</span></label>
        <input type="file" name="image" id="imageInput" accept="image/*" style="display:none">
        <input type="hidden" name="croppedImage" id="croppedImageInput">
        <div class="preview-wrap" id="previewWrap">
          <img id="previewImg" src="" alt="Cropped preview">
        </div>
        <button type="button" class="img-upload-btn" onclick="document.getElementById('imageInput').click()">
          📷 Tap to upload logo / photo
        </button>
        <p style="font-size:.75rem;color:#9ca3af;margin-top:5px">Crop to 1:1 square • JPG, PNG, WebP • max 5 MB</p>
      </div>

      <button type="submit" class="submit-btn" id="submitBtn">Submit Registration</button>
    </div>
  </form>

  <p class="note">Your listing will be reviewed before going live.<br>You'll receive a WhatsApp confirmation once approved. 🙏</p>
</div>

<!-- Profile Crop Modal -->
<div class="crop-modal" id="cropModal">
  <div class="crop-box">
    <h2>✂️ Crop to Square (1:1)</h2>
    <div class="crop-img-wrap"><img id="cropImg" src="" alt="crop"></div>
    <div class="crop-actions">
      <button type="button" class="btn-cancel" onclick="closeCrop()">Cancel</button>
      <button type="button" class="btn-crop" onclick="applyCrop()">Use This Crop</button>
    </div>
  </div>
</div>

<!-- Cover / Banner Crop Modal -->
<div class="crop-modal" id="coverCropModal">
  <div class="crop-box">
    <h2>✂️ Crop Banner Image</h2>
    <div class="crop-img-wrap"><img id="coverCropImg" src="" alt="crop"></div>
    <div class="crop-actions">
      <button type="button" class="btn-cancel" onclick="closeCoverCrop()">Cancel</button>
      <button type="button" class="btn-crop" onclick="applyCoverCrop()">Use This Crop</button>
    </div>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js"></script>
<script>
  const BACKEND = '${backendUrl}';
  let districtMap = {};
  let cropper = null;

  /* ── Load districts ── */
  fetch(BACKEND + '/public/districts')
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(({ map }) => {
      districtMap = map;
      const sel = document.getElementById('districtSel');
      sel.innerHTML = '<option value="">— Select District —</option>';
      Object.keys(map).sort().forEach(d => {
        const o = document.createElement('option');
        o.value = d; o.textContent = d;
        sel.appendChild(o);
      });
    })
    .catch(err => {
      const sel = document.getElementById('districtSel');
      sel.innerHTML = '<option value="">Failed to load — refresh</option>';
      console.error('Districts fetch failed:', err);
    });

  document.getElementById('districtSel').addEventListener('change', function () {
    const asel = document.getElementById('assemblySel');
    asel.innerHTML = '<option value="">— Select Assembly —</option>';
    (districtMap[this.value] || []).forEach(a => {
      const o = document.createElement('option');
      o.value = a; o.textContent = a;
      asel.appendChild(o);
    });
  });

  /* ── Image crop ── */
  document.getElementById('imageInput').addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.getElementById('cropImg');
      img.src = e.target.result;
      document.getElementById('cropModal').classList.add('active');
      if (cropper) { cropper.destroy(); cropper = null; }
      cropper = new Cropper(img, {
        aspectRatio: 1,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 1,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
      });
    };
    reader.readAsDataURL(file);
    this.value = '';
  });

  function closeCrop() {
    document.getElementById('cropModal').classList.remove('active');
    if (cropper) { cropper.destroy(); cropper = null; }
  }

  function applyCrop() {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({ width: 800, height: 800, imageSmoothingQuality: 'high' });
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      document.getElementById('previewImg').src = url;
      document.getElementById('previewWrap').style.display = 'block';

      /* Convert blob → base64 and store in hidden input for form submission */
      const reader = new FileReader();
      reader.onload = e => {
        document.getElementById('croppedImageInput').value = e.target.result;
      };
      reader.readAsDataURL(blob);

      closeCrop();
    }, 'image/jpeg', 0.88);
  }

  /* ── Current location ── */
  function useMyLocation() {
    const btn = document.getElementById('locBtn');
    const status = document.getElementById('locStatus');
    if (!navigator.geolocation) { status.textContent = 'GPS not supported on this browser.'; return; }
    btn.textContent = '⏳ Getting location…';
    btn.disabled = true;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        document.getElementById('latField').value = lat;
        document.getElementById('lngField').value = lng;
        status.textContent = 'GPS: ' + lat + ', ' + lng + ' ✓';
        status.style.color = '#16a34a';
        btn.textContent = '📍 Location Set ✓';
        /* Reverse geocode via Nominatim */
        fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng)
          .then(r => r.json())
          .then(d => {
            const addr = d.display_name || '';
            if (addr && !document.getElementById('addressField').value.trim()) {
              document.getElementById('addressField').value = addr;
            }
          })
          .catch(() => {});
      },
      err => {
        status.textContent = 'Location denied or unavailable.';
        status.style.color = '#dc2626';
        btn.textContent = '📍 Use Current Location';
        btn.disabled = false;
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  /* ── Dynamic Social Media ── */
  const SOCIAL_PLATFORMS = [
    {id:'fbLink',      label:'Facebook',      placeholder:'https://facebook.com/...'},
    {id:'twitterLink', label:'Twitter / X',   placeholder:'https://twitter.com/...'},
    {id:'instaLink',   label:'Instagram',     placeholder:'https://instagram.com/...'},
    {id:'googleMap',   label:'Google Maps',   placeholder:'https://maps.google.com/...'},
    {id:'videoUrl',    label:'YouTube',       placeholder:'https://youtube.com/...'},
  ];
  let shownSocial = [];

  function getSocialAvailable() {
    return SOCIAL_PLATFORMS.filter(p => !shownSocial.includes(p.id));
  }

  function addSocialRow() {
    const avail = getSocialAvailable();
    if (!avail.length) return;
    // Show platform picker chips
    const existing = document.getElementById('socialPicker');
    if (existing) { existing.remove(); return; }
    const picker = document.createElement('div');
    picker.id = 'socialPicker';
    picker.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px';
    avail.forEach(p => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = p.label;
      btn.style.cssText = 'padding:6px 14px;border:1px solid rgba(102,255,76,0.3);color:#66ff4c;background:rgba(102,255,76,0.02);border-radius:20px;font-size:.8rem;font-weight:700;cursor:pointer;transition:all 0.2s';
      btn.onmouseenter = () => btn.style.background = 'rgba(102,255,76,0.08)';
      btn.onmouseleave = () => btn.style.background = 'rgba(102,255,76,0.02)';
      btn.onclick = () => { picker.remove(); _addSocialPlatform(p); };
      picker.appendChild(btn);
    });
    document.getElementById('socialRows').appendChild(picker);
  }

  function _addSocialPlatform(p) {
    shownSocial.push(p.id);
    const row = document.createElement('div');
    row.className = 'social-item';
    row.id = 'srow_' + p.id;
    row.innerHTML = '<span class="s-label">' + p.label + '</span><input type="url" name="' + p.id + '" placeholder="' + p.placeholder + '"><button type="button" class="rm-btn" onclick="removeSocialRow(\\'' + p.id + '\\')">×</button>';
    document.getElementById('socialRows').appendChild(row);
    if (!getSocialAvailable().length) document.getElementById('addSocialBtn').style.display = 'none';
    else document.getElementById('addSocialBtn').style.display = '';
  }

  function removeSocialRow(id) {
    shownSocial = shownSocial.filter(x => x !== id);
    const row = document.getElementById('srow_' + id);
    if (row) row.remove();
    document.getElementById('addSocialBtn').style.display = '';
  }

  document.getElementById('addSocialBtn').addEventListener('click', addSocialRow);

  /* ── Dynamic Services ── */
  let svcCount = 0;

  function addSvc() {
    if (svcCount >= 6) return;
    svcCount++;
    const n = svcCount;
    const card = document.createElement('div');
    card.className = 'svc-card';
    card.dataset.svcn = n;
    card.innerHTML =
      '<div class="svc-num"><span class="svc-title">Service ' + n + '</span><button type="button" class="svc-rm" onclick="removeSvc(this)">✕ Remove</button></div>' +
      '<div class="row" style="margin-bottom:10px">' +
        '<div><label>Name</label><input type="text" name="service' + n + 'Name" placeholder="Service / product name"></div>' +
        '<div><label>Price (₹)</label><input type="text" name="service' + n + 'Price" placeholder="e.g. 500" inputmode="decimal"></div>' +
      '</div>' +
      '<div style="margin-bottom:10px"><label>Details</label><textarea name="service' + n + 'Detail" rows="2" placeholder="Brief description"></textarea></div>' +
      '<div><label>Service Photo <span style="color:#ef4444;font-weight:600">*</span></label>' +
        '<input type="file" name="service' + n + 'Image" accept="image/*" required onchange="_previewSvc(this)">' +
        '<div style="display:none;margin-top:6px" class="svc-prev-wrap"><img style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1.5px solid #e5e7eb" class="svc-prev-img"></div>' +
      '</div>';
    document.getElementById('svcContainer').appendChild(card);
    if (svcCount >= 6) document.getElementById('addSvcBtn').style.display = 'none';
  }

  function removeSvc(btn) {
    btn.closest('.svc-card').remove();
    svcCount--;
    // Renumber remaining cards
    document.querySelectorAll('.svc-card').forEach((card, idx) => {
      const num = idx + 1;
      card.dataset.svcn = num;
      card.querySelector('.svc-title').textContent = 'Service ' + num;
      const inp = card.querySelectorAll('input,textarea');
      const names = ['Name','Price','Detail','Image'];
      // Update field names based on position
      card.querySelector('input[type=text]:nth-of-type(1)') && (card.querySelectorAll('input[type=text]')[0].name = 'service'+num+'Name');
      card.querySelector('input[type=text]:nth-of-type(2)') && (card.querySelectorAll('input[type=text]')[1].name = 'service'+num+'Price');
      const ta = card.querySelector('textarea'); if(ta) ta.name = 'service'+num+'Detail';
      const fi = card.querySelector('input[type=file]'); if(fi) fi.name = 'service'+num+'Image';
    });
    document.getElementById('addSvcBtn').style.display = '';
  }

  function _previewSvc(input) {
    if (!input.files?.[0]) return;
    const wrap = input.closest('.svc-card').querySelector('.svc-prev-wrap');
    const img  = input.closest('.svc-card').querySelector('.svc-prev-img');
    const reader = new FileReader();
    reader.onload = e => { img.src = e.target.result; wrap.style.display = 'block'; };
    reader.readAsDataURL(input.files[0]);
  }

  /* ── Cover image banner crop (ratio matches h-44 / max-w-4xl = 896/176 ≈ 5.09) ── */
  const BANNER_RATIO = 896 / 176;
  let coverCropper = null;

  document.getElementById('coverImageInput').addEventListener('change', function () {
    if (!this.files?.[0]) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.getElementById('coverCropImg');
      img.src = e.target.result;
      document.getElementById('coverCropModal').classList.add('active');
      if (coverCropper) { coverCropper.destroy(); coverCropper = null; }
      coverCropper = new Cropper(img, {
        aspectRatio: BANNER_RATIO,
        viewMode: 1,
        autoCropArea: 1,
        dragMode: 'move',
      });
    };
    reader.readAsDataURL(this.files[0]);
    this.value = '';
  });

  function closeCoverCrop() {
    document.getElementById('coverCropModal').classList.remove('active');
    if (coverCropper) { coverCropper.destroy(); coverCropper = null; }
  }

  function applyCoverCrop() {
    if (!coverCropper) return;
    coverCropper.getCroppedCanvas({ maxWidth: 1600, imageSmoothingQuality: 'high' }).toBlob(function (blob) {
      /* Use DataTransfer to set the cropped file on the actual file input */
      const croppedFile = new File([blob], 'cover.jpg', { type: 'image/jpeg' });
      const dt = new DataTransfer();
      dt.items.add(croppedFile);
      document.getElementById('coverImageInput').files = dt.files;
      /* Show preview */
      const url = URL.createObjectURL(blob);
      document.getElementById('coverPreviewImg').src = url;
      document.getElementById('coverPreview').style.display = 'block';
      closeCoverCrop();
    }, 'image/jpeg', 0.88);
  }

  /* ── Gallery preview ── */
  document.getElementById('galleryInput').addEventListener('change', function () {
    const preview = document.getElementById('galleryPreview');
    preview.innerHTML = '';
    Array.from(this.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = document.createElement('img');
        img.src = e.target.result;
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });

  /* ── Submit ── */
  document.getElementById('regForm').addEventListener('submit', function (e) {
    const btn = document.getElementById('submitBtn');

    /* If a crop was done, remove the file input so only base64 is sent */
    const cropped = document.getElementById('croppedImageInput').value;
    if (cropped) {
      const fileInput = document.getElementById('imageInput');
      fileInput.disabled = true;
    }

    btn.textContent = 'Submitting…';
    btn.disabled = true;
  });

  /* ── Client theme toggle event listener ── */
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

module.exports = router;
