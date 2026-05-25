const express = require('express');
const multer = require('multer');
const { uploadBuffer } = require('../services/cloudinary');
const districts = require('../services/districts');
const Business = require('../models/Business');
const meta = require('../services/metaCloud');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

/* ── Public: district map (no auth) ── */
router.get('/districts', (_req, res) => {
  res.json({ map: districts.getMap() });
});

/* ── Registration form HTML ── */
router.get('/register', (req, res) => {
  const phone = String(req.query.phone || '').replace(/\D/g, '');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(buildFormHtml(phone));
});

/* ── Handle form submission ── */
router.post('/register', upload.single('image'), async (req, res) => {
  try {
    const { name, category, description, district, assembly, address, phone, ownerPhone } = req.body;

    if (!name || !district || !assembly) {
      return res.status(400).setHeader('Content-Type', 'text/html').send(
        pageShell('Missing Fields', `<div class="icon">⚠️</div><h1>Missing Required Fields</h1><p>Please go back and fill in Business Name, District, and Assembly.</p><a href="javascript:history.back()" class="btn">Go Back</a>`)
      );
    }

    const doc = {
      name: name.trim(),
      category: (category || '').trim(),
      description: (description || '').trim(),
      district: district.trim(),
      assembly: assembly.trim(),
      address: (address || '').trim(),
      phone: (phone || '').trim(),
      ownerPhone: (ownerPhone || '').trim(),
      active: false,
    };

    if (req.file) {
      const result = await uploadBuffer(req.file.buffer, { folder: 'vanigan/businesses' });
      doc.image = result.secure_url;
      doc.imagePublicId = result.public_id;
    }

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
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Register Your Business — Vanigan</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config={theme:{extend:{colors:{brand:{50:'#fff7ed',100:'#ffedd5',500:'#f97316',600:'#ea580c',700:'#c2410c',800:'#9a3412',900:'#7c2d12'}}}}}</script>
</head>
<body class="bg-brand-50 min-h-screen py-8 px-4">
  <div class="max-w-2xl mx-auto">

    <div class="text-center mb-8">
      <div class="text-4xl mb-2">🪔</div>
      <h1 class="text-2xl font-bold text-brand-900">Vanigan</h1>
      <p class="text-gray-500 text-sm mt-1">Register Your Business</p>
    </div>

    <form id="regForm" method="POST" action="/public/register" enctype="multipart/form-data"
          class="bg-white rounded-2xl shadow-sm border border-brand-100 p-6 space-y-5">

      <input type="hidden" name="ownerPhone" value="${escHtml(phone)}">

      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">Business Name <span class="text-red-500">*</span></label>
        <input type="text" name="name" required
               class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
               placeholder="e.g. Sri Lakshmi Stores">
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">Category</label>
        <input type="text" name="category"
               class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
               placeholder="e.g. Grocery, Textile, Restaurant">
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">Description</label>
        <textarea name="description" rows="3"
                  class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Brief description of your business"></textarea>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">District <span class="text-red-500">*</span></label>
          <select name="district" id="districtSel" required
                  class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
            <option value="">— Select District —</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Assembly Constituency <span class="text-red-500">*</span></label>
          <select name="assembly" id="assemblySel" required
                  class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
            <option value="">— Select District first —</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">Address</label>
        <textarea name="address" rows="2"
                  class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Full address of your business"></textarea>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">Business Phone Number</label>
        <input type="tel" name="phone" value="${escHtml(phone)}"
               class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
               placeholder="Contact number for this business">
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">Business Photo</label>
        <input type="file" name="image" accept="image/*" id="imageInput"
               class="hidden">
        <div id="imagePreviewWrap" class="hidden mb-2">
          <img id="imagePreview" class="h-32 rounded-xl object-cover border border-gray-200" alt="Preview">
        </div>
        <button type="button" onclick="document.getElementById('imageInput').click()"
                class="w-full border-2 border-dashed border-gray-300 rounded-xl py-4 text-sm text-gray-500 hover:border-brand-500 hover:text-brand-600 transition">
          📷 Tap to upload logo / storefront photo (max 5 MB)
        </button>
        <p class="text-xs text-gray-400 mt-1">Supported formats: JPG, PNG, WebP</p>
      </div>

      <button type="submit" id="submitBtn"
              class="w-full bg-brand-700 hover:bg-brand-800 text-white font-semibold py-3 rounded-xl transition text-sm">
        Submit Registration
      </button>
    </form>

    <p class="text-center text-xs text-gray-400 mt-5">
      Your listing will be reviewed by our team before going live.<br>
      You will receive a WhatsApp confirmation once approved. 🙏
    </p>
  </div>

  <script>
    let districtMap = {};

    fetch('/public/districts')
      .then(r => r.json())
      .then(({ map }) => {
        districtMap = map;
        const sel = document.getElementById('districtSel');
        Object.keys(map).forEach(d => {
          const o = document.createElement('option');
          o.value = d; o.textContent = d;
          sel.appendChild(o);
        });
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

    document.getElementById('imageInput').addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        document.getElementById('imagePreview').src = e.target.result;
        document.getElementById('imagePreviewWrap').classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('regForm').addEventListener('submit', function () {
      const btn = document.getElementById('submitBtn');
      btn.textContent = 'Submitting…';
      btn.disabled = true;
    });
  </script>
</body>
</html>`;
}

module.exports = router;
