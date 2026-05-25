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

    if (req.body.croppedImage && req.body.croppedImage.startsWith('data:image')) {
      const base64Data = req.body.croppedImage.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const result = await uploadBuffer(buffer, { folder: 'vanigan/businesses' });
      doc.image = result.secure_url;
      doc.imagePublicId = result.public_id;
    } else if (req.file) {
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

      <div class="field">
        <label>Category</label>
        <input type="text" name="category" placeholder="e.g. Grocery, Textile, Restaurant">
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
        <label>Address</label>
        <textarea name="address" rows="2" placeholder="Full address of your business"></textarea>
      </div>

      <div class="field">
        <label>Business Phone</label>
        <input type="tel" name="phone" value="${escHtml(phone)}" placeholder="Contact number">
      </div>

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
