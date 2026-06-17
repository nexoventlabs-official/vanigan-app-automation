/**
 * photoUpload.js
 * Public route — member photo upload with crop tool.
 * Opens from WhatsApp CTA button after registration.
 *
 * GET  /public/upload-photo?phone=XXXXXXXXXX  — show crop UI
 * POST /public/upload-photo                    — save photo, regenerate card, send via WhatsApp
 */
const express = require('express');
const multer  = require('multer');
const { uploadBuffer } = require('../services/memberCloudinary');
const { getMemberModel } = require('../services/memberDb');
const { generateAndUploadCard } = require('../services/memberCard');
const meta = require('../services/metaCloud');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'));
    }
    cb(null, true);
  },
});

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── GET — show upload page ── */
router.get('/upload-photo', async (req, res) => {
  const phone = String(req.query.phone || '').replace(/\D/g, '');
  const force = req.query.force === '1';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  // If member already has a photo and not forcing update, show "already generated" page
  if (phone && !force) {
    try {
      const VaniganMember = await getMemberModel();
      const member = await VaniganMember.findOne({ phone }).select('photoUrl membershipId name').lean();
      if (member && member.photoUrl) {
        return res.send(buildAlreadyGeneratedHtml(phone, member));
      }
    } catch {}
  }

  res.send(buildUploadHtml(phone));
});

/* ── POST — receive cropped base64 photo, save, regenerate card ── */
router.post('/upload-photo', upload.none(), async (req, res) => {
  const phone = String(req.body.phone || '').replace(/\D/g, '');
  const croppedBase64 = String(req.body.cropped_image || '');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!phone || !croppedBase64.startsWith('data:image')) {
    return res.status(400).send(resultHtml('❌ Invalid Request', 'Phone number or image is missing. Please go back and try again.', false));
  }

  try {
    const VaniganMember = await getMemberModel();
    const member = await VaniganMember.findOne({ phone }).lean();
    if (!member) {
      return res.status(404).send(resultHtml('❌ Not Found', 'No membership found for this number. Please sign up first.', false));
    }

    const isFirstPhoto = !member.photoUrl; // true = new member completing registration

    // Upload cropped photo to Cloudinary
    const base64Data = croppedBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const uploaded = await uploadBuffer(buffer, { phone, subfolder: 'photos' });

    // Update member photo
    await VaniganMember.updateOne({ phone }, {
      $set: { photoUrl: uploaded.secure_url, photoPublicId: uploaded.public_id }
    });

    // Regenerate card with new photo
    const updatedMember = { ...member, photoUrl: uploaded.secure_url, photoPublicId: uploaded.public_id };
    const { url: cardUrl } = await generateAndUploadCard(updatedMember);

    // Send welcome message + updated card via WhatsApp (async — don't block response)
    const whatsappPhone = '91' + phone;
    setImmediate(async () => {
      try {
        if (isFirstPhoto) {
          // First-time photo upload — send full welcome message then card
          await meta.sendText(whatsappPhone,
            `🎉 *Welcome to Vanigan, ${member.name}!*\n\n` +
            `✅ Your membership is now complete!\n` +
            `🪪 ID: *${member.membershipId}*\n` +
            `📍 ${member.assemblyName || ''}, ${member.district || ''}\n` +
            `🩸 ${member.bloodGroup || ''}  |  🎂 Age: ${member.age || ''}\n\n` +
            `Your membership card is ready! 🎨`
          );
        }
        // Send card image (both first-time and re-uploads)
        const caption = isFirstPhoto
          ? `🪪 *Your Vanigan Membership Card*\nID: *${member.membershipId}*\n\nSave this card image. Visit https://vanigan.digital to login.\nType *hi* anytime to open the menu.`
          : `🪪 *Updated Membership Card*\nID: *${member.membershipId}*\n\nYour photo has been updated. Type *hi* to open the menu.`;
        await meta.sendImage(whatsappPhone, cardUrl, caption);
      } catch (e) {
        console.error('[photoUpload] whatsapp send failed:', e.message);
      }
    });

    return res.send(resultHtml(
      '✅ Photo Uploaded!',
      `Your photo has been saved!\n\n${isFirstPhoto ? 'Your welcome message and membership card are being sent to your WhatsApp now. 🎉' : 'Your updated membership card is being sent to your WhatsApp now.'}\n\nMembership ID: ${member.membershipId}`,
      true
    ));
  } catch (err) {
    console.error('[photoUpload] error:', err.message);
    return res.status(500).send(resultHtml('❌ Upload Failed', `Something went wrong: ${esc(err.message)}. Please try again.`, false));
  }
});

function resultHtml(title, body, success) {
  const icon = success ? '✅' : '❌';
  const color = success ? '#009245' : '#ef4444';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Vanigan</title>
<style>*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;background:#eceff4;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.card{background:#fff;border-radius:12px;padding:40px 32px;max-width:420px;width:100%;text-align:center}
.icon{font-size:3rem;margin-bottom:16px}
h1{font-size:1.5rem;font-weight:700;color:${color};margin-bottom:12px}
p{color:#374151;line-height:1.6;font-size:.95rem;white-space:pre-line}
</style></head><body><div class="card">
<div class="icon">${icon}</div>
<h1>${esc(title)}</h1>
<p>${esc(body)}</p>
</div></body></html>`;
}

function buildUploadHtml(phone) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Upload Photo — Vanigan</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;background:#eceff4;min-height:100vh;padding:80px 16px 32px}
    .top-bar{position:fixed;top:0;left:0;right:0;background:#eceff4;border-bottom:1px solid #e5e7eb;
      padding:14px 24px;display:flex;align-items:center;z-index:1000}
    .wrap{max-width:480px;margin:0 auto}
    .card{background:#fff;border-radius:12px;padding:28px 24px;margin-bottom:20px}
    h1{font-size:1.6rem;font-weight:700;color:#111;margin-bottom:8px}
    p{color:#6b7280;font-size:.9rem;line-height:1.55;margin-bottom:16px}
    .upload-btn{width:100%;border:2px dashed #d1d5db;border-radius:12px;padding:24px;
      text-align:center;cursor:pointer;color:#6b7280;font-size:.9rem;font-weight:600;
      background:rgba(0,0,0,.01);transition:all .2s}
    .upload-btn:hover{border-color:#009245;color:#009245}
    .crop-wrap{display:none;margin-top:16px;max-height:60vh;overflow:hidden;border-radius:12px}
    .crop-wrap img{display:block;max-width:100%}
    .btn{width:100%;padding:12px;border-radius:12px;border:none;font-size:.95rem;font-weight:700;
      cursor:pointer;transition:opacity .2s;margin-top:12px}
    .btn-primary{background:#009245;color:#fff}
    .btn-primary:hover{opacity:.9}
    .btn-primary:disabled{background:#d1d5db;color:#9ca3af;cursor:not-allowed}
    #preview-img{display:none;width:160px;height:160px;border-radius:16px;object-fit:cover;
      margin:16px auto 0;border:3px solid #009245;display:block}
    .status{text-align:center;font-size:.85rem;color:#009245;font-weight:600;margin-top:12px;display:none}
  </style>
</head>
<body>
  <div class="top-bar">
    <img src="https://vanigan.org/front/images/home/tnvslogo.png" alt="Vanigan" style="height:28px">
  </div>
  <div class="wrap">
    <div class="card">
      <h1>📸 Upload Your Photo</h1>
      <p>Add a photo to personalise your Vanigan Membership Card.<br>Tap below to choose a photo, crop it, then submit.</p>

      <div class="upload-btn" onclick="document.getElementById('fileInput').click()">
        📷 Tap to choose a photo
      </div>
      <input type="file" id="fileInput" accept="image/*" style="display:none">

      <div class="crop-wrap" id="cropWrap">
        <img id="cropImg" src="" alt="Crop">
      </div>

      <img id="preview-img" alt="Preview" style="display:none">
      <p id="preview-label" style="text-align:center;color:#009245;font-weight:600;margin-top:8px;display:none">✅ Photo ready to submit</p>

      <button class="btn btn-primary" id="submitBtn" disabled onclick="submitPhoto()">
        Submit Photo &amp; Update Card
      </button>
      <div class="status" id="status">⏳ Uploading and generating your card…</div>
    </div>
  </div>

  <form id="uploadForm" method="POST" action="/public/upload-photo" style="display:none">
    <input type="hidden" name="phone" value="${esc(phone)}">
    <input type="hidden" name="cropped_image" id="croppedInput">
  </form>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js"></script>
  <script>
    let cropper = null;

    document.getElementById('fileInput').addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(ev) {
        const cropWrap = document.getElementById('cropWrap');
        const cropImg  = document.getElementById('cropImg');
        cropWrap.style.display = 'block';
        cropImg.src = ev.target.result;
        if (cropper) cropper.destroy();
        cropper = new Cropper(cropImg, {
          aspectRatio: 1,
          viewMode: 1,
          dragMode: 'move',
          autoCropArea: 0.85,
          restore: false,
          guides: true,
          center: true,
          highlight: false,
          cropBoxMovable: true,
          cropBoxResizable: true,
          toggleDragModeOnDblclick: false,
        });
        document.getElementById('submitBtn').disabled = false;
        document.getElementById('preview-img').style.display = 'none';
        document.getElementById('preview-label').style.display = 'none';
      };
      reader.readAsDataURL(file);
    });

    function submitPhoto() {
      if (!cropper) return;
      const canvas = cropper.getCroppedCanvas({ width: 400, height: 400, imageSmoothingQuality: 'high' });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      // Show preview
      const prev = document.getElementById('preview-img');
      prev.src = dataUrl;
      prev.style.display = 'block';
      document.getElementById('preview-label').style.display = 'block';
      document.getElementById('cropWrap').style.display = 'none';

      document.getElementById('croppedInput').value = dataUrl;
      document.getElementById('submitBtn').disabled = true;
      document.getElementById('status').style.display = 'block';
      document.getElementById('uploadForm').submit();
    }
  </script>
</body>
</html>`;
}

function buildAlreadyGeneratedHtml(phone, member) {
  const esc = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Membership Card — Vanigan</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;background:#eceff4;min-height:100vh;
      display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:#fff;border-radius:12px;padding:36px 28px;max-width:420px;
      width:100%;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,.06)}
    .icon{font-size:3rem;margin-bottom:16px}
    h1{font-size:1.4rem;font-weight:700;color:#009245;margin-bottom:10px}
    .mid{color:#111;font-size:.9rem;line-height:1.6;margin-bottom:20px}
    .id-badge{background:#f0fdf4;border:2px solid #009245;border-radius:8px;
      padding:10px 18px;display:inline-block;font-size:1.1rem;font-weight:700;
      color:#009245;letter-spacing:.05em;margin-bottom:24px}
    .btn{display:inline-block;padding:12px 24px;border-radius:12px;font-size:.9rem;
      font-weight:700;text-decoration:none;cursor:pointer;border:none;width:100%;
      margin-bottom:10px;text-align:center}
    .btn-primary{background:#009245;color:#fff}
    .btn-outline{background:#fff;color:#009245;border:2px solid #009245}
    .note{font-size:.75rem;color:#9ca3af;margin-top:12px}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🪪</div>
    <h1>Card Already Generated!</h1>
    <p class="mid">Your Vanigan Membership Card has already been created for<br><strong>${esc(member.name || 'you')}</strong></p>
    <div class="id-badge">${esc(member.membershipId || '')}</div>
    <p class="mid">Your card was sent to your WhatsApp. Check your chat history.</p>
    <a href="/public/upload-photo?phone=${esc(phone)}&force=1" class="btn btn-outline">
      🔄 Update My Photo
    </a>
    <p class="note">Updating your photo will regenerate and resend your card on WhatsApp.</p>
  </div>
</body>
</html>`;
}

module.exports = router;
