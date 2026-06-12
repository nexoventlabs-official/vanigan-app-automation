const express = require('express');
const multer = require('multer');
const { uploadBuffer } = require('../services/cloudinary');
const { uploadBuffer: bizUpload } = require('../services/businessCloudinary');
const districts = require('../services/districts');
const Business = require('../models/Business');
const meta = require('../services/metaCloud');
const generateListingCode = require('../utils/generateListingCode');
const SUB_CATEGORIES = require('../utils/subCategories');
const SUB_CATEGORIES_JSON = JSON.stringify(SUB_CATEGORIES);

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
  const phone       = String(req.query.phone       || '').replace(/\D/g, '');
  const category    = String(req.query.category    || '').trim();
  const subCategory = String(req.query.subCategory || '').trim();
  const district    = String(req.query.district    || '').trim();
  const assembly    = String(req.query.assembly    || '').trim();
  const bizName     = String(req.query.bizName     || '').trim();
  const ownerName   = String(req.query.ownerName   || '').trim();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (phone) {
    const existing = await Business.findOne({ ownerPhone: phone }).lean().catch(() => null);
    if (existing) {
      return res.send(pageShell('Already Registered', `
        <div class="icon">🏪</div>
        <h1>Already Registered!</h1>
        <p><strong>${escHtml(existing.name)}</strong> is already registered on Vanigan.</p>
        <p class="sub">You can manage your listing anytime in the My Business section. 🙏</p>
      `));
    }
  }

  res.send(buildFormHtml(phone, { category, subCategory, district, assembly, bizName, ownerName }));
});

/* ── Handle form submission ── */
router.post('/register', uploadFields, async (req, res) => {
  try {
    const { name, category, subCategory, description, district, assembly, address,
            phone, whatsappNo, landline, ownerPhone, ownerName, phone2, email, website, landmark,
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
      ownerName:        String(ownerName  || '').trim(),
      active:           true,
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
        `✅ *${doc.name}* is now live on Vanigan!\n\n📋 Your Listing Code: *${doc.listingCode}*\n\nPlease set your 4-digit security PIN at the registration link to manage your listing.\n\nThank you 🙏`
      ).catch(() => {});
    }

    /* ── Show PIN setup page ── */
    res.setHeader('Content-Type', 'text/html').send(
      buildPinSetupHtml({ name: doc.name, listingCode: doc.listingCode, ownerPhone: doc.ownerPhone || '' })
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
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(title)} — Vanigan</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #eceff4;
      --card-bg: #ffffff;
      --card-border: #eceff4;
      --text-main: #000000;
      --text-muted: #5b616b;
      --accent-color: #0b7443;
      --charcoal-black: #000000;
      --font-sans: 'Inter', Arial, sans-serif;
    }
    *{box-sizing:border-box;margin:0;padding:0}
    body{
      font-family: var(--font-sans);
      background-color: var(--bg-color);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 24px 24px;
    }
    .top-bar{
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: var(--bg-color);
      border-bottom: 1px solid var(--card-border);
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 1000;
    }
    .card{
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      box-shadow: none;
      padding: 48px 40px;
      max-width: 480px;
      width: 100%;
      text-align: center;
    }
    .icon{margin-bottom: 20px; font-size: 3rem;}
    h1{font-family: var(--font-sans); font-size: 1.8rem; color: var(--charcoal-black); margin-bottom: 14px; font-weight: 700; letter-spacing: -0.02em}
    p{color: var(--text-main); line-height: 1.65; margin-bottom: 8px; font-size: 0.95rem;}
    p.sub{font-size: 0.85rem; color: var(--text-muted); margin-top: 16px; border-top: 1px solid var(--card-border); padding-top: 16px}
    strong{color: var(--charcoal-black); font-weight: 700}
    .btn{
      display: inline-block;
      margin-top: 24px;
      padding: 10px 20px;
      background: var(--accent-color);
      color: #ffffff;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.85rem;
      border: none;
      cursor: pointer;
      transition: opacity 0.2s ease;
    }
    .btn:hover{opacity: 0.9;}
  </style>
</head>
<body>
  <div class="top-bar">
    <div style="display:flex;align-items:center;gap:12px">
      <img src="https://vanigan.org/front/images/home/tnvslogo.png" alt="Vanigan" style="height:28px;width:auto">
    </div>
  </div>
  <div class="card">${bodyContent}</div>
</body>
</html>`;
}

function buildFormHtml(phone, prefill = {}) {
  const { category = '', subCategory = '', bizName = '', ownerName = '' } = prefill;
  const rawDistrict = prefill.district || '';
  const rawAssembly = prefill.assembly || '';
  const backendUrl = (process.env.BACKEND_URL || '').replace(/\/+$/, '');

  /* ── Normalise district to match tn-districts.json casing ── */
  const allDistricts = districts.getDistricts();
  const district = rawDistrict
    ? (allDistricts.find(d => d.toLowerCase() === rawDistrict.toLowerCase()) || rawDistrict)
    : '';

  /* ── Normalise assembly casing against the actual list for this district ── */
  const assembliesForDistrict = district ? districts.getAssemblies(district) : [];
  const assembly = rawAssembly
    ? (assembliesForDistrict.find(a => a.toLowerCase() === rawAssembly.toLowerCase()) || rawAssembly)
    : '';

  /* ── Server-side render: category options with selected ── */
  const ALL_CATEGORIES = ['Hospitals & Clinics','Transport','Electricals & Electronics','Education','Sports','Real Estate','Spa & Beauty','Digital & IT Products','Hire Services','Automobile','B2B Services','Banquets & Event Halls','Bills & Recharge','Caterers','Civil Contractors','Daily Needs','Doctors','Jobs','Jewellery','Labs & Diagnostics','Banking & Finance','Packers & Movers','Wedding Services','Hotels & Restaurants','Repairs','IT & Software','Construction Materials','Pest Control','Agriculture','Printing Services','Textiles & Garments','Travel & Tourism','Home Appliances','Demand Services','Religious','Organic Products','Advertising','Insurance','Advocate & Legal','Courier Services'];
  const categoryOptionsHtml = ALL_CATEGORIES
    .map(c => `<option value="${escHtml(c)}"${c === category ? ' selected' : ''}>${escHtml(c)}</option>`)
    .join('');

  /* ── Server-side render: sub-category options ── */
  const subCatsForCategory = (SUB_CATEGORIES[category] || []);
  const subCategoryOptionsHtml = subCatsForCategory
    .map(s => `<option value="${escHtml(s)}"${s === subCategory ? ' selected' : ''}>${escHtml(s)}</option>`)
    .join('');
  const showSubCatWrap = subCatsForCategory.length > 0;

  /* ── Server-side render: district options ── */
  const districtOptionsHtml = allDistricts
    .map(d => `<option value="${escHtml(d)}"${d === district ? ' selected' : ''}>${escHtml(d)}</option>`)
    .join('');

  /* ── Server-side render: assembly options for pre-selected district ── */
  const assemblyOptionsHtml = assembliesForDistrict.length
    ? assembliesForDistrict.map(a => `<option value="${escHtml(a)}"${a === assembly ? ' selected' : ''}>${escHtml(a)}</option>`).join('')
    : '';
    return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Register Your Business — Vanigan</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #eceff4;
      --card-bg: #ffffff;
      --card-border: #eceff4;
      --text-main: #000000;
      --text-muted: #5b616b;
      --input-bg: #ffffff;
      --input-border: #eceff4;
      --accent-color: #0b7443;
      --charcoal-black: #000000;
      --font-sans: 'Inter', Arial, sans-serif;
      --svc-card-bg: #ffffff;
      --svc-card-border: #eceff4;
    }
    *{box-sizing:border-box;margin:0;padding:0}
    body{
      font-family: var(--font-sans);
      background-color: var(--bg-color);
      min-height: 100vh;
      color: var(--text-main);
      padding: 96px 16px 32px;
      position: relative;
      overflow-x: hidden;
    }
    .top-bar{
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: var(--bg-color);
      border-bottom: 1px solid var(--card-border);
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 1000;
    }
    .wrap{max-width: 560px; margin: 0 auto; position: relative; z-index: 1}
    .header{text-align: center; margin-bottom: 24px}
    .header h1{font-family: var(--font-sans); font-size: 2.2rem; font-weight: 700; color: var(--charcoal-black); letter-spacing: -0.02em}
    .header p{font-size: .95rem; color: var(--text-muted); margin-top: 6px;}
    
    .card{
      background: var(--card-bg); 
      border: 1px solid var(--card-border); 
      border-radius: 12px; 
      box-shadow: none; 
      padding: 36px 32px; 
      margin-bottom: 24px;
    }
    
    .card-header {
      margin-bottom: 24px;
      text-align: left;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 16px;
    }
    .card-step {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      color: var(--accent-color);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 4px;
    }
    .card-header h2 {
      font-family: var(--font-sans);
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--charcoal-black);
      margin-bottom: 4px;
    }
    .card-header p {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin: 0;
    }
    
    label{display: block; font-size: 11px; font-weight: 600; color: var(--charcoal-black); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px}
    .req{color: #ef4444}
    
    input,select,textarea{
      width: 100%; 
      border: 1px solid var(--input-border); 
      border-radius: 12px; 
      padding: 10px 14px; 
      font-size: .9rem; 
      outline: none; 
      background-color: var(--input-bg); 
      color: var(--text-main); 
      transition: border-color .15s ease;
      font-family: var(--font-sans);
    }
    input:focus,select:focus,textarea:focus{border-color: var(--accent-color);}
    textarea{resize: vertical}
    .row{display: grid; grid-template-columns: 1fr 1fr; gap: 12px}
    @media(max-width: 480px){
      .row{grid-template-columns: 1fr}
      .card { padding: 24px 16px; margin-bottom: 16px; }
    }
    .field{margin-bottom: 18px}
    
    select{
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%235b616b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
      background-position: right 0.75rem center;
      background-size: 1.25rem 1.25rem;
      background-repeat: no-repeat;
      padding-right: 2.5rem;
      cursor: pointer;
    }
    select option{
      background-color: var(--card-bg);
      color: var(--text-main);
    }
    
    #locBtn {
      background: none;
      border: none;
      color: var(--accent-color);
      font-size: .8rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      text-decoration: underline;
      transition: opacity 0.2s;
    }
    #locBtn:hover {
      opacity: 0.8;
    }
    
    .img-upload-btn {
      width: 100%; 
      border: 1px dashed var(--input-border); 
      border-radius: 12px; 
      padding: 20px; 
      text-align: center; 
      font-size: .85rem; 
      color: var(--text-muted); 
      cursor: pointer; 
      transition: all .2s; 
      background: rgba(0,0,0,0.01);
      font-family: var(--font-sans);
      font-weight: 500;
    }
    .img-upload-btn:hover{border-color: var(--accent-color); color: var(--accent-color); background: rgba(11,116,67,0.03)}
    
    .crop-modal{display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45); backdrop-filter: blur(4px); z-index: 9999; flex-direction: column; align-items: center; justify-content: center; padding: 16px}
    .crop-modal.active{display: flex}
    .crop-box{background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; padding: 24px; width: 100%; max-width: 480px; box-shadow: none}
    .crop-box h2{font-family: var(--font-sans); font-size: 1.2rem; font-weight: 700; margin-bottom: 16px; color: var(--charcoal-black)}
    .crop-img-wrap{max-height: 55vh; overflow: hidden; border-radius: 12px; background: #000; border: 1px solid var(--card-border)}
    .crop-img-wrap img{display: block; max-width: 100%}
    .crop-actions{display: flex; gap: 12px; margin-top: 16px}
    .crop-actions button{flex: 1; padding: 10px 16px; border-radius: 12px; font-weight: 600; font-size: .85rem; border: none; cursor: pointer; transition: all 0.2s}
    .btn-crop{background: var(--accent-color); color: #ffffff}
    .btn-crop:hover{opacity: 0.9}
    .btn-cancel{background: transparent; color: var(--text-main); border: 1px solid var(--input-border)}
    .btn-cancel:hover{background: var(--bg-color)}
    
    .preview-wrap{display: none; margin-bottom: 10px}
    .preview-wrap img{width: 100%; aspect-ratio: 1/1; object-fit: cover; border-radius: 12px; border: 1px solid var(--card-border); margin-bottom: 12px}

    .submit-btn {
      width: 100%; 
      background: var(--accent-color); 
      color: #ffffff; 
      font-weight: 600; 
      padding: 12px 24px; 
      border-radius: 12px; 
      border: none; 
      font-size: 0.95rem; 
      cursor: pointer; 
      transition: opacity 0.2s ease;
      font-family: var(--font-sans);
    }
    .submit-btn:hover{opacity: 0.9}
    .submit-btn:disabled{background: #e5e7eb; color: #9ca3af; border: 1px solid #e5e7eb; cursor: not-allowed}
    .note{text-align: center; font-size: .75rem; color: var(--text-muted); margin-top: 16px}
    .sec-title{font-size: 11px; font-weight: 700; color: var(--charcoal-black); text-transform: uppercase; letter-spacing: .08em; margin-top: 24px; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid var(--card-border)}
    .svc-card{background: var(--svc-card-bg); border: 1px solid var(--svc-card-border); border-radius: 12px; padding: 20px; margin-bottom: 16px; transition: all .2s}
    .svc-card:hover{border-color: var(--accent-color)}
    .img-thumb{width: 64px; height: 64px; object-fit: cover; border-radius: 12px; border: 1px solid var(--card-border)}
    .gallery-preview{display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px}
    .gallery-preview img{width: 64px; height: 64px; object-fit: cover; border-radius: 12px; border: 1px solid var(--card-border)}
    
    .add-dyn-btn{
      width: 100%; 
      padding: 11px; 
      background: transparent; 
      color: var(--accent-color); 
      border: 1px dashed var(--input-border); 
      border-radius: 12px; 
      font-size: .85rem; 
      font-weight: 600; 
      cursor: pointer; 
      margin: 8px 0 20px; 
      text-align: center; 
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .add-dyn-btn:hover{background: rgba(11,116,67,0.03); border-color: var(--accent-color)}
    
    .social-item{display: flex; align-items: center; gap: 8px; margin-bottom: 10px}
    .social-item .s-label{font-size: 10px; font-weight: 800; color: var(--text-muted); width: 110px; min-width: 110px; text-transform: uppercase; letter-spacing: 0.05em}
    .social-item input{flex: 1; margin: 0}
    .social-item .rm-btn{background: none; border: none; color: #ef4444; font-size: 1.3rem; cursor: pointer; padding: 0 4px; line-height: 1; flex-shrink: 0; transition: transform .2s}
    .social-item .rm-btn:hover{transform: scale(1.15)}
    .svc-num{font-size: 10px; font-weight: 700; color: var(--charcoal-black); margin-bottom: 12px; text-transform: uppercase; letter-spacing: .05em; display: flex; justify-content: space-between; align-items: center}
    .svc-rm{background: none; border: none; color: #ef4444; font-size: 10px; font-weight: 700; cursor: pointer; padding: 0; text-transform: uppercase; letter-spacing: 0.05em}
    
    #daysWrap{display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px}
    #daysWrap label {
      display: inline-flex !important;
      align-items: center;
      gap: 6px;
      font-weight: 400 !important;
      font-size: .85rem !important;
      cursor: pointer;
      padding: 6px 12px;
      background: var(--card-bg);
      border: 1px solid var(--input-border);
      border-radius: 80px;
      color: var(--text-main) !important;
      transition: all 0.2s;
      margin: 2px;
      text-transform: none !important;
      letter-spacing: 0 !important;
    }
    #daysWrap label:has(input:checked) {
      background: var(--accent-color) !important;
      border-color: var(--accent-color) !important;
      color: #ffffff !important;
    }
    #daysWrap input[type=checkbox] {
      display: none;
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <div style="display:flex;align-items:center;gap:12px">
      <img src="https://vanigan.org/front/images/home/tnvslogo.png" alt="Vanigan" style="height:28px;width:auto">
    </div>
  </div>
  <div class="wrap">
  <div class="header">
    <div class="icon"><img src="https://vanigan.org/front/images/home/tnvslogo.png" alt="Vanigan" style="height:48px;width:auto"></div>
    <h1>Vanigan</h1>
    <p>Register Your Business</p>
  </div>

  <form id="regForm" method="POST" action="${backendUrl}/public/register" enctype="multipart/form-data">
    <input type="hidden" name="ownerPhone" value="${escHtml(phone)}">
    <input type="hidden" name="ownerName"  value="${escHtml(ownerName)}">

    ${ownerName || district ? `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px 18px;margin-bottom:20px;font-family:inherit">
      <div style="font-size:12px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">✅ Member Details Pre-filled</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;font-size:13px;color:#374151">
        ${ownerName ? `<div>👤 <strong>Name:</strong> ${escHtml(ownerName)}</div>` : ''}
        ${phone     ? `<div>📱 <strong>Phone:</strong> ${escHtml(phone)}</div>` : ''}
        ${district  ? `<div>📍 <strong>District:</strong> ${escHtml(district)}</div>` : ''}
        ${assembly  ? `<div>🏛 <strong>Assembly:</strong> ${escHtml(assembly)}</div>` : ''}
        ${bizName   ? `<div>🏪 <strong>Business:</strong> ${escHtml(bizName)}</div>` : ''}
      </div>
    </div>
    ` : ''}
    <!-- Card 1: Basic Information -->
    <div class="card">
      <div class="card-header">
        <span class="card-step">Section 1 of 8</span>
        <h2>Basic Information</h2>
        <p>Introduce your business to the community</p>
      </div>

      <div class="field">
        <label>Business Name <span class="req">*</span></label>
        <input type="text" name="name" required placeholder="e.g. Sri Lakshmi Stores" value="${escHtml(bizName)}">
        ${bizName ? '<p style="font-size:.75rem;color:#6b7280;margin-top:3px">✅ Auto-filled from your signup — you can edit this</p>' : ''}
      </div>

      <div class="row field">
        <div>
          <label>Category</label>
          <select name="category">
            <option value="">— Select Category —</option>
            ${categoryOptionsHtml}
          </select>
        </div>
        <div id="subCatWrap" style="${showSubCatWrap ? '' : 'display:none'}">
          <label>Sub-Category</label>
          <select id="subCatSel" name="subCategory">
            <option value="">— Select Sub-Category —</option>
            ${subCategoryOptionsHtml}
          </select>
        </div>
      </div>

      <div class="field">
        <label>Description</label>
        <textarea name="description" rows="3" placeholder="Brief description of what your business does, specialty, etc."></textarea>
      </div>
    </div>

    <!-- Card 2: Location & Address -->
    <div class="card">
      <div class="card-header">
        <span class="card-step">Section 2 of 8</span>
        <h2>Location &amp; Address</h2>
        <p>Help customers find your physical location</p>
      </div>

      <div class="row field">
        <div>
          <label>District <span class="req">*</span></label>
          <select name="district" id="districtSel" required
            ${district ? 'style="background:var(--bg-color);color:var(--text-muted);border-color:var(--input-border);" disabled' : ''}>
            <option value="">— Select District —</option>
            ${districtOptionsHtml}
          </select>
          ${district ? `<input type="hidden" name="district" value="${escHtml(district)}">` : ''}
        </div>
        <div>
          <label>Assembly <span class="req">*</span></label>
          <select name="assembly" id="assemblySel" required
            ${assembly ? 'style="background:var(--bg-color);color:var(--text-muted);border-color:var(--input-border);" disabled' : ''}>
            <option value="">Select district first</option>
            ${assemblyOptionsHtml}
          </select>
          ${assembly ? `<input type="hidden" name="assembly" value="${escHtml(assembly)}">` : ''}
          ${district && assembly ? '<p style="font-size:.75rem;color:#6b7280;margin-top:3px">✅ Auto-filled from your membership profile</p>' : ''}
        </div>
      </div>

      <div class="field">
        <label style="display:flex;justify-content:space-between;align-items:center">
          <span>Address <span class="req">*</span></span>
          <button type="button" id="locBtn" onclick="useMyLocation()">📍 Use Current Location</button>
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
    </div>

    <!-- Card 3: Contact Info -->
    <div class="card">
      <div class="card-header">
        <span class="card-step">Section 3 of 8</span>
        <h2>Contact Details</h2>
        <p>Provide contact channels for customers to reach you</p>
      </div>

      <div class="field">
        <label>Business Person / Owner Name <span class="req">*</span></label>
        <input type="text" name="ownerName" value="${escHtml(ownerName)}"
          placeholder="Owner or contact person name" required
          ${ownerName ? 'style="background:var(--bg-color);color:var(--text-muted);border-color:var(--input-border);" readonly' : ''}>
        ${ownerName ? '<p style="font-size:.75rem;color:#6b7280;margin-top:3px">✅ Auto-filled from your membership profile</p>' : ''}
      </div>

      <div class="field">
        <label>WhatsApp / Primary Phone <span class="req">*</span></label>
        <input type="tel" name="phone" value="${escHtml(phone)}" style="background:var(--bg-color);color:var(--text-muted);cursor:not-allowed;border-color:var(--input-border)" readonly>
      </div>

      <div class="row field">
        <div>
          <label>WhatsApp No (Public)</label>
          <input type="tel" name="whatsappNo" value="${escHtml(phone)}" placeholder="WhatsApp contact number">
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
    </div>

    <!-- Card 4: Social Media -->
    <div class="card">
      <div class="card-header">
        <span class="card-step">Section 4 of 8</span>
        <h2>Social Links</h2>
        <p>Add links to your social media pages (optional)</p>
      </div>
      <div id="socialRows"></div>
      <button type="button" id="addSocialBtn" class="add-dyn-btn">+ Add Social Media</button>
    </div>

    <!-- Card 5: Operating Hours -->
    <div class="card">
      <div class="card-header">
        <span class="card-step">Section 5 of 8</span>
        <h2>Operating Schedule</h2>
        <p>Specify when your business is open for customers</p>
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
    </div>

    <!-- Card 6: Services / Products -->
    <div class="card">
      <div class="card-header">
        <span class="card-step">Section 6 of 8</span>
        <h2>Services &amp; Products</h2>
        <p>List key services or products you offer (optional)</p>
      </div>
      <div id="svcContainer"></div>
      <button type="button" id="addSvcBtn" class="add-dyn-btn" onclick="addSvc()">+ Add Service / Product</button>
    </div>

    <!-- Card 7: Media & Gallery -->
    <div class="card">
      <div class="card-header">
        <span class="card-step">Section 7 of 8</span>
        <h2>Business Media</h2>
        <p>Upload photos to make your listing look attractive</p>
      </div>

      <div class="field" style="margin-bottom: 24px;">
        <label>Profile Photo <span style="color:#888;font-weight:400">(1:1 ratio logo or main photo)</span></label>
        <input type="file" name="image" id="imageInput" accept="image/*" style="display:none">
        <input type="hidden" name="croppedImage" id="croppedImageInput">
        <div class="preview-wrap" id="previewWrap">
          <img id="previewImg" src="" alt="Cropped preview">
        </div>
        <button type="button" class="img-upload-btn" onclick="document.getElementById('imageInput').click()">
          📷 Upload Profile / Logo Photo
        </button>
        <p style="font-size:.75rem;color:#9ca3af;margin-top:5px">Will crop to a square • JPG, PNG, WebP • max 5 MB</p>
      </div>

      <div class="field" style="margin-bottom: 24px;">
        <label>Cover / Banner Photo <span style="color:#888;font-weight:400">(5:1 wide banner)</span></label>
        <input type="file" name="coverImage" id="coverImageInput" accept="image/*" style="display:none">
        <div id="coverPreview" style="display:none;margin-bottom:10px">
          <img id="coverPreviewImg" style="width:100%;height:110px;object-fit:cover;border-radius:10px;border:1.5px solid #e5e7eb">
        </div>
        <button type="button" class="img-upload-btn" onclick="document.getElementById('coverImageInput').click()">
          🖼️ Upload Cover / Banner Photo
        </button>
        <p style="font-size:.75rem;color:#9ca3af;margin-top:5px">Crops to 5:1 wide banner ratio • JPG, PNG, WebP • max 5 MB</p>
      </div>

      <div class="field">
        <label>Gallery Photos <span style="color:#888;font-weight:400">(up to 10 additional images)</span></label>
        <input type="file" name="galleryImages" id="galleryInput" accept="image/*" multiple style="display:none">
        <div class="gallery-preview" id="galleryPreview" style="margin-bottom:10px"></div>
        <button type="button" class="img-upload-btn" onclick="document.getElementById('galleryInput').click()">
          📸 Upload Gallery Images
        </button>
        <p style="font-size:.75rem;color:#9ca3af;margin-top:5px">Select multiple photos of your business/products • max 5 MB per file</p>
      </div>
    </div>

    <!-- Card 8: FAQ & Submit -->
    <div class="card" style="margin-bottom: 32px;">
      <div class="card-header">
        <span class="card-step">Section 8 of 8</span>
        <h2>FAQ &amp; Submission</h2>
        <p>Answer a common question and submit your registration</p>
      </div>

      <div class="field">
        <label>Frequently Asked Question</label>
        <input type="text" name="infoQuestion" placeholder="e.g. Do you offer home delivery?">
      </div>

      <div class="field" style="margin-bottom: 28px;">
        <label>Answer</label>
        <textarea name="infoAnswer" rows="2" placeholder="Your answer to the above question"></textarea>
      </div>

      <button type="submit" class="submit-btn" id="submitBtn">Submit Registration</button>
    </div>
  </form>

  <p class="note">Your listing goes live right after you submit.<br>You'll receive a WhatsApp confirmation shortly. 🙏</p>
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
(function() {
'use strict';

var BACKEND = '${backendUrl}';
var SUB_CATS = ${SUB_CATEGORIES_JSON};

/* ── Category / Sub-category ── */
var catSel  = document.querySelector('select[name="category"]');
var subWrap = document.getElementById('subCatWrap');
var subSel  = document.getElementById('subCatSel');

function refreshSub() {
  if (!catSel || !subSel || !subWrap) return;
  var val  = catSel.value;
  var opts = SUB_CATS[val] || [];
  var prev = subSel.value;
  subSel.innerHTML = '<option value="">\u2014 Select Sub-Category \u2014</option>';
  for (var i = 0; i < opts.length; i++) {
    var o = document.createElement('option');
    o.value = opts[i]; o.textContent = opts[i];
    if (opts[i] === prev) o.selected = true;
    subSel.appendChild(o);
  }
  subWrap.style.display = opts.length ? '' : 'none';
}

if (catSel) catSel.addEventListener('change', refreshSub);

/* ── Districts (for change listener after server-rendered options) ── */
var districtMap = {};
var distSel  = document.getElementById('districtSel');
var assemSel = document.getElementById('assemblySel');

fetch(BACKEND + '/public/districts')
  .then(function(r) { return r.json(); })
  .then(function(data) {
    districtMap = data.map || {};
    if (distSel && !distSel.value) {
      distSel.innerHTML = '<option value="">\u2014 Select District \u2014</option>';
      Object.keys(districtMap).sort().forEach(function(d) {
        var o = document.createElement('option');
        o.value = d; o.textContent = d;
        distSel.appendChild(o);
      });
    }
  })
  .catch(function() {});

if (distSel) {
  distSel.addEventListener('change', function() {
    if (!assemSel) return;
    assemSel.innerHTML = '<option value="">\u2014 Select Assembly \u2014</option>';
    var list = districtMap[this.value] || [];
    list.forEach(function(a) {
      var o = document.createElement('option');
      o.value = a; o.textContent = a;
      assemSel.appendChild(o);
    });
  });
}

/* ── Profile image crop ── */
var cropper = null;
var imageInput = document.getElementById('imageInput');
if (imageInput) {
  imageInput.addEventListener('change', function() {
    var file = this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = document.getElementById('cropImg');
      img.src = e.target.result;
      document.getElementById('cropModal').classList.add('active');
      if (cropper) { cropper.destroy(); cropper = null; }
      cropper = new Cropper(img, { aspectRatio: 1, viewMode: 1, dragMode: 'move', autoCropArea: 1 });
    };
    reader.readAsDataURL(file);
    this.value = '';
  });
}

function closeCrop() {
  var m = document.getElementById('cropModal');
  if (m) m.classList.remove('active');
  if (cropper) { cropper.destroy(); cropper = null; }
}

function applyCrop() {
  if (!cropper) return;
  cropper.getCroppedCanvas({ width: 800, height: 800 }).toBlob(function(blob) {
    var url = URL.createObjectURL(blob);
    var prev = document.getElementById('previewImg');
    var wrap = document.getElementById('previewWrap');
    if (prev) prev.src = url;
    if (wrap) wrap.style.display = 'block';
    var reader = new FileReader();
    reader.onload = function(e) {
      var ci = document.getElementById('croppedImageInput');
      if (ci) ci.value = e.target.result;
    };
    reader.readAsDataURL(blob);
    closeCrop();
  }, 'image/jpeg', 0.88);
}

/* ── Cover image crop ── */
var BANNER_RATIO = 896 / 176;
var coverCropper = null;
var coverInput = document.getElementById('coverImageInput');
if (coverInput) {
  coverInput.addEventListener('change', function() {
    if (!this.files || !this.files[0]) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = document.getElementById('coverCropImg');
      img.src = e.target.result;
      document.getElementById('coverCropModal').classList.add('active');
      if (coverCropper) { coverCropper.destroy(); coverCropper = null; }
      coverCropper = new Cropper(img, { aspectRatio: BANNER_RATIO, viewMode: 1, autoCropArea: 1, dragMode: 'move' });
    };
    reader.readAsDataURL(this.files[0]);
    this.value = '';
  });
}

function closeCoverCrop() {
  var m = document.getElementById('coverCropModal');
  if (m) m.classList.remove('active');
  if (coverCropper) { coverCropper.destroy(); coverCropper = null; }
}

function applyCoverCrop() {
  if (!coverCropper) return;
  coverCropper.getCroppedCanvas({ maxWidth: 1600 }).toBlob(function(blob) {
    var file = new File([blob], 'cover.jpg', { type: 'image/jpeg' });
    var dt = new DataTransfer();
    dt.items.add(file);
    var ci = document.getElementById('coverImageInput');
    if (ci) ci.files = dt.files;
    var url = URL.createObjectURL(blob);
    var prev = document.getElementById('coverPreviewImg');
    var wrap = document.getElementById('coverPreview');
    if (prev) prev.src = url;
    if (wrap) wrap.style.display = 'block';
    closeCoverCrop();
  }, 'image/jpeg', 0.88);
}

// Expose handlers used by inline HTML onclick attributes.
window.useMyLocation = useMyLocation;
window.addSvc = addSvc;
window.closeCrop = closeCrop;
window.applyCrop = applyCrop;
window.closeCoverCrop = closeCoverCrop;
window.applyCoverCrop = applyCoverCrop;

/* ── Gallery preview ── */
var galleryInput = document.getElementById('galleryInput');
if (galleryInput) {
  galleryInput.addEventListener('change', function() {
    var preview = document.getElementById('galleryPreview');
    if (!preview) return;
    preview.innerHTML = '';
    Array.prototype.forEach.call(this.files, function(file) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var img = document.createElement('img');
        img.src = e.target.result;
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });
}

/* ── Location ── */
function useMyLocation() {
  var btn    = document.getElementById('locBtn');
  var status = document.getElementById('locStatus');
  if (!navigator.geolocation) { if (status) status.textContent = 'GPS not supported.'; return; }
  if (btn) { btn.textContent = '\u23f3 Getting location\u2026'; btn.disabled = true; }
  navigator.geolocation.getCurrentPosition(
    function(pos) {
      var lat = pos.coords.latitude.toFixed(6);
      var lng = pos.coords.longitude.toFixed(6);
      var lf = document.getElementById('latField');
      var lgf = document.getElementById('lngField');
      var af = document.getElementById('addressField');
      if (lf) lf.value = lat;
      if (lgf) lgf.value = lng;
      if (status) { status.textContent = 'GPS: ' + lat + ', ' + lng + ' \u2713'; status.style.color = 'var(--accent-color)'; }
      if (btn) btn.textContent = '\uD83D\uDCCD Location Set \u2713';
      fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng)
        .then(function(r) { return r.json(); })
        .then(function(d) { if (d.display_name && af && !af.value.trim()) af.value = d.display_name; })
        .catch(function() {});
    },
    function() {
      if (status) { status.textContent = 'Location denied or unavailable.'; status.style.color = '#ef4444'; }
      if (btn) { btn.textContent = '\uD83D\uDCCD Use Current Location'; btn.disabled = false; }
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}

/* ── Social Media (dynamic rows) ── */
var SOCIAL_PLATFORMS = [
  { id: 'fbLink',      label: 'Facebook',    placeholder: 'https://facebook.com/...' },
  { id: 'twitterLink', label: 'Twitter / X', placeholder: 'https://twitter.com/...' },
  { id: 'instaLink',   label: 'Instagram',   placeholder: 'https://instagram.com/...' },
  { id: 'googleMap',   label: 'Google Maps', placeholder: 'https://maps.google.com/...' },
  { id: 'videoUrl',    label: 'YouTube',     placeholder: 'https://youtube.com/...' },
];
var shownSocial = [];

function addSocialRow() {
  var avail = SOCIAL_PLATFORMS.filter(function(p) { return shownSocial.indexOf(p.id) === -1; });
  if (!avail.length) return;
  var existing = document.getElementById('socialPicker');
  if (existing) { existing.remove(); return; }
  var picker = document.createElement('div');
  picker.id = 'socialPicker';
  picker.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px';
  avail.forEach(function(p) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = p.label;
    btn.style.cssText = 'padding:6px 14px;border:1px solid var(--accent-color);color:var(--accent-color);background:transparent;border-radius:12px;font-size:.8rem;font-weight:600;cursor:pointer';
    btn.onclick = function() { picker.remove(); addSocialPlatform(p); };
    picker.appendChild(btn);
  });
  var rows = document.getElementById('socialRows');
  if (rows) rows.appendChild(picker);
}

function addSocialPlatform(p) {
  shownSocial.push(p.id);
  var row = document.createElement('div');
  row.className = 'social-item';
  row.id = 'srow_' + p.id;
  var span = document.createElement('span');
  span.className = 's-label';
  span.textContent = p.label;
  var inp = document.createElement('input');
  inp.type = 'url';
  inp.name = p.id;
  inp.placeholder = p.placeholder;
  var rmBtn = document.createElement('button');
  rmBtn.type = 'button';
  rmBtn.className = 'rm-btn';
  rmBtn.textContent = '\u00d7';
  rmBtn.onclick = function() { removeSocialRow(p.id); };
  row.appendChild(span);
  row.appendChild(inp);
  row.appendChild(rmBtn);
  var rows = document.getElementById('socialRows');
  if (rows) rows.appendChild(row);
  var addBtn = document.getElementById('addSocialBtn');
  var stillAvail = SOCIAL_PLATFORMS.filter(function(x) { return shownSocial.indexOf(x.id) === -1; });
  if (addBtn) addBtn.style.display = stillAvail.length ? '' : 'none';
}

function removeSocialRow(id) {
  shownSocial = shownSocial.filter(function(x) { return x !== id; });
  var row = document.getElementById('srow_' + id);
  if (row) row.remove();
  var addBtn = document.getElementById('addSocialBtn');
  if (addBtn) addBtn.style.display = '';
}

var addSocialBtn = document.getElementById('addSocialBtn');
if (addSocialBtn) addSocialBtn.addEventListener('click', addSocialRow);

/* ── Services / Products (dynamic cards) ── */
var svcCount = 0;

function addSvc() {
  if (svcCount >= 6) return;
  svcCount++;
  var n = svcCount;
  var card = document.createElement('div');
  card.className = 'svc-card';
  card.dataset.svcn = n;

  /* Header row */
  var hdr = document.createElement('div');
  hdr.className = 'svc-num';
  var ttl = document.createElement('span');
  ttl.className = 'svc-title';
  ttl.textContent = 'Service ' + n;
  var rmBtn = document.createElement('button');
  rmBtn.type = 'button';
  rmBtn.className = 'svc-rm';
  rmBtn.textContent = '\u2715 Remove';
  rmBtn.onclick = function() { removeSvc(card); };
  hdr.appendChild(ttl);
  hdr.appendChild(rmBtn);
  card.appendChild(hdr);

  /* Name + Price row */
  var row = document.createElement('div');
  row.className = 'row';
  row.style.marginBottom = '10px';
  var d1 = document.createElement('div');
  d1.innerHTML = '<label>Name</label><input type="text" name="service' + n + 'Name" placeholder="Service / product name">';
  var d2 = document.createElement('div');
  d2.innerHTML = '<label>Price (\u20b9)</label><input type="text" name="service' + n + 'Price" placeholder="e.g. 500" inputmode="decimal">';
  row.appendChild(d1);
  row.appendChild(d2);
  card.appendChild(row);

  /* Details */
  var det = document.createElement('div');
  det.style.marginBottom = '10px';
  det.innerHTML = '<label>Details</label><textarea name="service' + n + 'Detail" rows="2" placeholder="Brief description"></textarea>';
  card.appendChild(det);

  /* Photo upload */
  var photoWrap = document.createElement('div');
  var fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.name = 'service' + n + 'Image';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  fileInput.onchange = function() { previewSvc(fileInput, card); };

  var uploadBtn = document.createElement('button');
  uploadBtn.type = 'button';
  uploadBtn.className = 'img-upload-btn';
  uploadBtn.style.cssText = 'padding:12px;margin:0;font-size:0.8rem';
  uploadBtn.textContent = '\uD83D\uDCF8 Upload Service Photo';
  uploadBtn.onclick = function() { fileInput.click(); };

  var prevWrap = document.createElement('div');
  prevWrap.className = 'svc-prev-wrap';
  prevWrap.style.display = 'none';
  prevWrap.style.marginTop = '8px';
  var prevImg = document.createElement('img');
  prevImg.className = 'svc-prev-img';
  prevImg.style.cssText = 'width:64px;height:64px;object-fit:cover;border-radius:12px';
  prevWrap.appendChild(prevImg);

  photoWrap.innerHTML = '<label>Service Photo</label>';
  photoWrap.appendChild(fileInput);
  photoWrap.appendChild(uploadBtn);
  photoWrap.appendChild(prevWrap);
  card.appendChild(photoWrap);

  document.getElementById('svcContainer').appendChild(card);
  var addBtn = document.getElementById('addSvcBtn');
  if (svcCount >= 6 && addBtn) addBtn.style.display = 'none';
}

function removeSvc(card) {
  card.remove();
  svcCount--;
  document.querySelectorAll('.svc-card').forEach(function(c, idx) {
    var num = idx + 1;
    c.dataset.svcn = num;
    var ttl = c.querySelector('.svc-title');
    if (ttl) ttl.textContent = 'Service ' + num;
    var texts = c.querySelectorAll('input[type=text]');
    if (texts[0]) texts[0].name = 'service' + num + 'Name';
    if (texts[1]) texts[1].name = 'service' + num + 'Price';
    var ta = c.querySelector('textarea');
    if (ta) ta.name = 'service' + num + 'Detail';
    var fi = c.querySelector('input[type=file]');
    if (fi) fi.name = 'service' + num + 'Image';
  });
  var addBtn = document.getElementById('addSvcBtn');
  if (addBtn) addBtn.style.display = '';
}

function previewSvc(input, card) {
  if (!input.files || !input.files[0]) return;
  var wrap = card.querySelector('.svc-prev-wrap');
  var img  = card.querySelector('.svc-prev-img');
  var reader = new FileReader();
  reader.onload = function(e) {
    if (img) img.src = e.target.result;
    if (wrap) wrap.style.display = 'block';
  };
  reader.readAsDataURL(input.files[0]);
}

/* ── Form submit ── */
var regForm = document.getElementById('regForm');
if (regForm) {
  regForm.addEventListener('submit', function() {
    var btn = document.getElementById('submitBtn');
    var cropped = document.getElementById('croppedImageInput');
    if (cropped && cropped.value) {
      var fi = document.getElementById('imageInput');
      if (fi) fi.disabled = true;
    }
    if (btn) { btn.textContent = 'Submitting\u2026'; btn.disabled = true; }
  });
}

})(); // end IIFE
</script>
</body>
</html>`;
}

/* ── PIN Setup Page (shown after registration) ── */
function buildPinSetupHtml({ name, listingCode, ownerPhone }) {
  const backendUrl = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm with Membership PIN — Vanigan</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #eceff4;
      --card: #ffffff;
      --border: #eceff4;
      --text: #000000;
      --muted: #5b616b;
      --accent: #0b7443;
      --font-sans: 'Inter', Arial, sans-serif;
    }
    *{box-sizing:border-box;margin:0;padding:0}
    body{
      font-family: var(--font-sans);
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px 24px;
    }
    .top-bar{
      position: fixed;
      top: 0; left: 0; right: 0;
      background: var(--bg);
      border-bottom: 1px solid var(--border);
      padding: 14px 24px;
      z-index: 100;
    }
    .card{
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 40px 32px;
      width: 100%;
      max-width: 420px;
      text-align: center;
    }
    .icon{ font-size: 3rem; margin-bottom: 16px; }
    h1{
      font-size: 1.7rem; font-weight: 700;
      margin-bottom: 8px; letter-spacing: -.02em; color: var(--text);
    }
    .sub{
      color: var(--muted); font-size: .87rem;
      line-height: 1.6; margin-bottom: 24px;
    }
    .code-badge{
      display: inline-block;
      background: #fee9d1; border: 1px solid rgba(113,80,57,.3);
      color: #715039; border-radius: 80px;
      padding: 6px 16px; font-size: .8rem; font-weight: 700;
      letter-spacing: .05em; margin: 8px 0 20px;
    }
    .divider{ border: none; border-top: 1px solid var(--border); margin: 24px 0; }
    .hint-box{
      background: #f0fdf4; border: 1px solid #bbf7d0;
      border-radius: 10px; padding: 12px 16px;
      margin-bottom: 20px; text-align: left;
      font-size: .82rem; color: #166534; line-height: 1.5;
    }
    .pin-wrap{
      display: flex; gap: 12px;
      justify-content: center; margin: 8px 0 20px;
    }
    .pin-box{
      width: 56px; height: 64px;
      border: 1px solid var(--border); border-radius: 12px;
      background: var(--card); font-size: 1.8rem; font-weight: 700;
      text-align: center; color: var(--text); outline: none;
      transition: all .2s; caret-color: transparent;
    }
    .pin-box:focus{ border-color: var(--accent); background: #e1fdea; }
    label.lbl{
      display: block; font-size: .75rem; font-weight: 700;
      letter-spacing: .07em; text-transform: uppercase;
      color: var(--muted); margin-bottom: 10px; text-align: left;
    }
    .btn{
      width: 100%; background: var(--accent); color: #fff;
      font-weight: 600; padding: 12px 16px; border-radius: 12px;
      border: none; font-size: .88rem; cursor: pointer;
      transition: opacity .2s; margin-top: 4px;
    }
    .btn:hover:not(:disabled){ opacity: .9; }
    .btn:disabled{
      background: #e5e7eb; color: #9ca3af;
      cursor: not-allowed; border: 1px solid #e5e7eb;
    }
    .err{ color: #ef4444; font-size: .8rem; margin-top: 8px; min-height: 20px; }
    .ok-msg{
      display: none;
      background: #e1fdea; border: 1px solid var(--accent);
      border-radius: 12px; padding: 16px; margin-top: 16px;
      color: var(--text); font-size: .87rem; font-weight: 500; text-align: left;
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <img src="https://vanigan.org/front/images/home/tnvslogo.png" alt="Vanigan" style="height:28px">
  </div>

  <div class="card">
    <div class="icon">✅</div>
    <h1>Business Submitted!</h1>
    <p class="sub">
      <strong style="color:var(--text)">${escHtml(name)}</strong> is now live on Vanigan.
    </p>
    <div class="code-badge"># ${escHtml(listingCode)}</div>

    <hr class="divider">

    <div class="hint-box">
      🔐 <strong>One last step</strong> — enter the 4-digit PIN you set when you signed up for your Vanigan membership. This links your business to your account.
    </div>

    <div id="step1">
      <label class="lbl">Your Membership PIN</label>
      <div class="pin-wrap" id="pinBoxes1">
        <input class="pin-box" type="password" inputmode="numeric" maxlength="1" data-idx="0">
        <input class="pin-box" type="password" inputmode="numeric" maxlength="1" data-idx="1">
        <input class="pin-box" type="password" inputmode="numeric" maxlength="1" data-idx="2">
        <input class="pin-box" type="password" inputmode="numeric" maxlength="1" data-idx="3">
      </div>

      <div class="err" id="pinErr"></div>
      <button class="btn" id="setPinBtn" onclick="submitPin()">Confirm &amp; Link Business</button>
    </div>

    <div class="ok-msg" id="okMsg">
      🎉 <strong>Business linked!</strong><br><br>
      You can now access and manage your listing from the <strong>"My Business"</strong> section using your phone number and membership PIN.
    </div>
  </div>

<script>
  const BACKEND    = '${backendUrl}';
  const OWNER_PHONE = '${escHtml(ownerPhone)}';

  function initPinBoxes(wrapId) {
    const boxes = document.querySelectorAll('#' + wrapId + ' .pin-box');
    boxes.forEach((box, i) => {
      box.addEventListener('input', function() {
        this.value = this.value.replace(/\\D/g,'').slice(-1);
        if (this.value && i < boxes.length - 1) boxes[i+1].focus();
      });
      box.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' && !this.value && i > 0) boxes[i-1].focus();
      });
      box.addEventListener('paste', function(e) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\\D/g,'');
        text.split('').slice(0,4).forEach((ch, j) => { if (boxes[i+j]) boxes[i+j].value = ch; });
        const last = Math.min(i + text.length, boxes.length - 1);
        boxes[last].focus();
      });
    });
  }

  initPinBoxes('pinBoxes1');

  function getPin(wrapId) {
    return Array.from(document.querySelectorAll('#' + wrapId + ' .pin-box')).map(b => b.value).join('');
  }

  async function submitPin() {
    const pin = getPin('pinBoxes1');
    const errEl = document.getElementById('pinErr');
    errEl.textContent = '';

    if (pin.length < 4) { errEl.textContent = 'Please enter your 4-digit membership PIN.'; return; }

    const btn = document.getElementById('setPinBtn');
    btn.textContent = 'Verifying…';
    btn.disabled = true;

    try {
      // Use relative URL — page is served from the same backend domain,
      // so this avoids any CORS preflight entirely.
      const resp = await fetch('/api/member-auth/verify-business-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: OWNER_PHONE, pin }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        if (data.error === 'wrong_pin') {
          errEl.textContent = 'Incorrect PIN. Please enter the PIN you set during signup.';
        } else if (data.error === 'no_member') {
          errEl.textContent = 'No Vanigan membership found for this number. Please sign up first.';
        } else {
          errEl.textContent = data.message || data.error || 'Something went wrong. Please try again.';
        }
        btn.textContent = 'Confirm & Link Business';
        btn.disabled = false;
        return;
      }

      document.getElementById('step1').style.display = 'none';
      document.getElementById('okMsg').style.display = 'block';
    } catch(e) {
      errEl.textContent = 'Error: ' + (e.message || 'Connection failed. Please try again.');
      btn.textContent = 'Confirm & Link Business';
      btn.disabled = false;
    }
  }
</script>
</body>
</html>`;
}

module.exports = router;
