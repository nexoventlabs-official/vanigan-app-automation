const express = require('express');
const multer = require('multer');
const { uploadBuffer } = require('../services/cloudinary');
const { uploadBuffer: bizUpload } = require('../services/businessCloudinary');
const districts = require('../services/districts');
const Business = require('../models/Business');
const meta = require('../services/metaCloud');

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
            fbLink, twitterLink, googleMap, videoUrl, infoQuestion, infoAnswer,
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

    await Business.create(doc);

    if (doc.ownerPhone) {
      meta.sendText(
        doc.ownerPhone,
        `✅ *${doc.name}* has been submitted for listing on Vanigan!\n\nOur team will review and activate your business shortly.\n\nThank you 🙏`
      ).catch(() => {});
    }

    res.setHeader('Content-Type', 'text/html').send(
      pageShell('Registration Successful', `
        <div class="icon">✅</div>
        <h1>Registration Submitted!</h1>
        <p><strong>${escHtml(doc.name)}</strong> has been submitted for listing on Vanigan.</p>
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
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fef7ee;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:#fff;border-radius:20px;box-shadow:0 4px 24px rgba(0,0,0,.08);padding:48px 40px;max-width:480px;width:100%;text-align:center}
    .icon{font-size:56px;margin-bottom:16px}
    h1{font-size:1.6rem;color:#1a1a1a;margin-bottom:12px}
    p{color:#555;line-height:1.6;margin-bottom:8px}
    p.sub{font-size:.9rem;color:#888;margin-top:12px}
    .btn{display:inline-block;margin-top:24px;padding:12px 28px;background:#c2410c;color:#fff;text-decoration:none;border-radius:10px;font-weight:600}
  </style>
</head>
<body><div class="card">${bodyContent}</div></body>
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
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff7ed;min-height:100vh;padding:24px 16px}
    .wrap{max-width:560px;margin:0 auto}
    .header{text-align:center;margin-bottom:24px}
    .header .icon{font-size:40px;margin-bottom:6px}
    .header h1{font-size:1.5rem;font-weight:700;color:#7c2d12}
    .header p{font-size:.85rem;color:#888;margin-top:4px}
    .card{background:#fff;border-radius:20px;box-shadow:0 2px 16px rgba(0,0,0,.07);padding:24px;margin-bottom:16px}
    label{display:block;font-size:.8rem;font-weight:600;color:#374151;margin-bottom:5px}
    .req{color:#ef4444}
    input,select,textarea{width:100%;border:1.5px solid #d1d5db;border-radius:12px;padding:10px 14px;font-size:.9rem;outline:none;background:#fff;transition:border-color .2s}
    input:focus,select:focus,textarea:focus{border-color:#c2410c}
    textarea{resize:vertical}
    .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    @media(max-width:480px){.row{grid-template-columns:1fr}}
    .field{margin-bottom:16px}

    /* Image crop area */
    .img-upload-btn{width:100%;border:2px dashed #d1d5db;border-radius:14px;padding:20px;text-align:center;font-size:.85rem;color:#9ca3af;cursor:pointer;transition:border-color .2s,color .2s;background:none}
    .img-upload-btn:hover{border-color:#c2410c;color:#c2410c}
    .crop-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;flex-direction:column;align-items:center;justify-content:center;padding:16px}
    .crop-modal.active{display:flex}
    .crop-box{background:#fff;border-radius:16px;padding:16px;width:100%;max-width:480px}
    .crop-box h2{font-size:1rem;font-weight:600;margin-bottom:12px;color:#1a1a1a}
    .crop-img-wrap{max-height:55vh;overflow:hidden;border-radius:8px;background:#000}
    .crop-img-wrap img{display:block;max-width:100%}
    .crop-actions{display:flex;gap:10px;margin-top:14px}
    .crop-actions button{flex:1;padding:11px;border-radius:10px;font-weight:600;font-size:.9rem;border:none;cursor:pointer}
    .btn-crop{background:#c2410c;color:#fff}
    .btn-cancel{background:#f3f4f6;color:#374151}
    .preview-wrap{display:none;margin-bottom:10px}
    .preview-wrap img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:12px;border:2px solid #e5e7eb}

    .submit-btn{width:100%;background:#c2410c;color:#fff;font-weight:600;padding:14px;border-radius:14px;border:none;font-size:1rem;cursor:pointer;transition:background .2s}
    .submit-btn:hover{background:#9a3412}
    .submit-btn:disabled{background:#9ca3af;cursor:not-allowed}
    .note{text-align:center;font-size:.75rem;color:#9ca3af;margin-top:12px}
    .sec-title{font-size:.75rem;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:.07em;margin-bottom:14px;padding-bottom:6px;border-bottom:1.5px solid #fde8d8}
    .svc-card{background:#fafafa;border:1.5px solid #e5e7eb;border-radius:12px;padding:14px;margin-bottom:12px}
    .svc-num{font-size:.7rem;font-weight:700;color:#c2410c;margin-bottom:10px;text-transform:uppercase;letter-spacing:.05em}
    .img-thumb{width:64px;height:64px;object-fit:cover;border-radius:8px;border:1.5px solid #e5e7eb}
    .gallery-preview{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
    .gallery-preview img{width:64px;height:64px;object-fit:cover;border-radius:8px;border:1.5px solid #e5e7eb}
  </style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="icon">🪔</div>
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
          <button type="button" id="locBtn" onclick="useMyLocation()" style="background:none;border:none;color:#c2410c;font-size:.8rem;font-weight:600;cursor:pointer;padding:0">📍 Use Current Location</button>
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
          <label>WhatsApp No <span style="color:#888;font-weight:400">(if different)</span></label>
          <input type="tel" name="whatsappNo" placeholder="WhatsApp number">
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

      <div class="row field">
        <div>
          <label>Facebook Page</label>
          <input type="url" name="fbLink" placeholder="https://facebook.com/...">
        </div>
        <div>
          <label>Twitter / X</label>
          <input type="url" name="twitterLink" placeholder="https://twitter.com/...">
        </div>
      </div>

      <div class="row field">
        <div>
          <label>Google Maps Link</label>
          <input type="url" name="googleMap" placeholder="https://maps.google.com/...">
        </div>
        <div>
          <label>YouTube / Video URL</label>
          <input type="url" name="videoUrl" placeholder="https://youtube.com/...">
        </div>
      </div>

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
        <label>Cover / Banner Photo <span style="color:#888;font-weight:400">(wide banner image)</span></label>
        <input type="file" name="coverImage" id="coverImageInput" accept="image/*">
        <div id="coverPreview" style="display:none;margin-top:8px">
          <img id="coverPreviewImg" style="width:100%;height:110px;object-fit:cover;border-radius:10px;border:1.5px solid #e5e7eb">
        </div>
      </div>

      <div class="sec-title" style="margin-top:4px">Gallery Images <span style="font-weight:400;text-transform:none;font-size:.7rem;color:#888">(optional — up to 10)</span></div>

      <div class="field">
        <label>Upload multiple photos of your business</label>
        <input type="file" name="galleryImages" id="galleryInput" accept="image/*" multiple>
        <div class="gallery-preview" id="galleryPreview"></div>
      </div>

      <div class="sec-title" style="margin-top:4px">Services / Products <span style="font-weight:400;text-transform:none;font-size:.7rem;color:#888">(optional — up to 6)</span></div>

      ${[1,2,3,4,5,6].map(i => `
      <div class="svc-card">
        <div class="svc-num">Service ${i}</div>
        <div class="row" style="margin-bottom:10px">
          <div>
            <label>Name</label>
            <input type="text" name="service${i}Name" placeholder="Service / product name">
          </div>
          <div>
            <label>Price (\u20b9)</label>
            <input type="text" name="service${i}Price" placeholder="e.g. 500" inputmode="decimal">
          </div>
        </div>
        <div style="margin-bottom:10px">
          <label>Details / Description</label>
          <textarea name="service${i}Detail" rows="2" placeholder="Brief description"></textarea>
        </div>
        <div>
          <label>Service Photo <span style="color:#888;font-weight:400">(optional)</span></label>
          <input type="file" name="service${i}Image" accept="image/*" onchange="previewSvcImg(this,${i})">
          <div id="svcPrev${i}" style="display:none;margin-top:6px"><img id="svcPrevImg${i}" class="img-thumb"></div>
        </div>
      </div>`).join('')}

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

<!-- Crop Modal -->
<div class="crop-modal" id="cropModal">
  <div class="crop-box">
    <h2>✂️ Crop to Square</h2>
    <div class="crop-img-wrap"><img id="cropImg" src="" alt="crop"></div>
    <div class="crop-actions">
      <button type="button" class="btn-cancel" onclick="closeCrop()">Cancel</button>
      <button type="button" class="btn-crop" onclick="applyCrop()">Use This Crop</button>
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

  /* ── Service image preview ── */
  function previewSvcImg(input, idx) {
    if (!input.files?.[0]) return;
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('svcPrevImg' + idx).src = e.target.result;
      document.getElementById('svcPrev' + idx).style.display = 'block';
    };
    reader.readAsDataURL(input.files[0]);
  }

  /* ── Cover image preview ── */
  document.getElementById('coverImageInput').addEventListener('change', function () {
    if (!this.files?.[0]) return;
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('coverPreviewImg').src = e.target.result;
      document.getElementById('coverPreview').style.display = 'block';
    };
    reader.readAsDataURL(this.files[0]);
  });

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
</script>
</body>
</html>`;
}

module.exports = router;
