const express = require('express');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const defaultCloud = require('../services/cloudinary');
const safeError = require('../utils/safeError');

const SPECIAL_TYPES = new Set(['gallery', 'services', 'coverimage', 'latlng', '_latlng_pair', 'dayspicker', 'textarea', 'time', 'email', 'url']);

const MULTI_FIELDS = [
  { name: 'image',          maxCount: 1 },
  { name: 'coverImageFile', maxCount: 1 },
  { name: 'galleryFiles',   maxCount: 20 },
  ...[1,2,3,4,5,6].map(n => ({ name: `service${n}Image`, maxCount: 1 })),
];

/**
 * Build a CRUD router for Business / Organizer / Member listings.
 *
 * Options:
 *   Model            Mongoose model
 *   folder           Cloudinary sub-folder
 *   extraFields      array of field-name strings for simple text fields
 *   multiImage       if true, enable cover/gallery/services image uploads
 *   cloudinaryService override Cloudinary service (uploadBuffer, destroy, ROOT)
 *   getPhone         optional fn(doc, req) → phone string — when provided, uploads go
 *                    to vanigan_members/{phone}/business/... via memberCloudinary
 */
function listingRouter({ Model, folder, extraFields = [], multiImage = false, cloudinaryService, perItemFolder = false, onBeforeCreate, getPhone }) {
  const { uploadBuffer: _uploadBuffer, destroy, ROOT, deleteByPrefix } = cloudinaryService || defaultCloud;

  // If getPhone is provided, wrap uploadBuffer to route into per-phone folders
  // The folder arg from the factory looks like: ROOT/businesses, ROOT/businesses/gallery, etc.
  // We translate that to subfolder: business, business/gallery, business/services, etc.
  function resolveUpload(phone) {
    if (!phone || !getPhone) return _uploadBuffer;
    const { uploadBuffer: memberUpload } = require('../services/memberCloudinary');
    return (buffer, { folder: f } = {}) => {
      // Strip ROOT/businesses (or ROOT/organizers) prefix to get the sub-path
      // e.g. vanigan_members/businesses          → subfolder: business
      //      vanigan_members/businesses/gallery  → subfolder: business/gallery
      //      vanigan_members/organizers           → subfolder: organizer
      const base = `${ROOT}/${folder}`;
      // Default subfolder is the singular form of folder name
      const defaultSub = folder.replace(/s$/, ''); // businesses→business, organizers→organizer
      let sub = defaultSub;
      if (f && f.startsWith(base)) {
        const rest = f.slice(base.length).replace(/^\//, '');
        sub = rest ? `${defaultSub}/${rest}` : defaultSub;
      }
      return memberUpload(buffer, { phone, subfolder: sub });
    };
  }
  const router = express.Router();
  const uploader = multiImage ? upload.fields(MULTI_FIELDS) : upload.single('image');

  const getFile  = (req, name) => multiImage ? (req.files?.[name]?.[0] || null) : (name === 'image' ? req.file : null);
  const getFiles = (req, name) => multiImage ? (req.files?.[name] || [])        : [];

  /* ── helpers ── */
  function applySimpleFields(target, body, fields) {
    for (const f of fields) {
      const name = typeof f === 'string' ? f : f.name;
      const type = typeof f === 'string' ? '' : (f.type || '');
      if (SPECIAL_TYPES.has(type)) continue;
      if (body[name] !== undefined) target[name] = String(body[name]);
    }
  }

  async function applyServices(item, body, files, uploadBuffer) {
    const existing = Array.isArray(item.services) ? [...item.services] : [];
    while (existing.length < 6) existing.push({ name:'', price:'', detail:'', image:'', imagePublicId:'' });
    for (let i = 1; i <= 6; i++) {
      const s = { ...existing[i-1] };
      if (body[`service${i}Name`]   !== undefined) s.name   = body[`service${i}Name`];
      if (body[`service${i}Price`]  !== undefined) s.price  = body[`service${i}Price`];
      if (body[`service${i}Detail`] !== undefined) s.detail = body[`service${i}Detail`];
      const sf = getFile(files, `service${i}Image`);
      if (sf) {
        if (s.imagePublicId) await destroy(s.imagePublicId).catch(() => {});
        const r = await uploadBuffer(sf.buffer, { folder: `${ROOT}/${folder}/services` });
        s.image = r.secure_url; s.imagePublicId = r.public_id;
      }
      existing[i-1] = s;
    }
    item.services = existing.filter(s => s.name || s.image);
  }

  async function applyGallery(item, body, files, uploadBuffer) {
    const toRemove = (body.galleryToRemove || '').split(',').filter(Boolean);
    if (toRemove.length) {
      for (const pid of toRemove) await destroy(pid).catch(() => {});
      item.galleryImages = (item.galleryImages || []).filter(g => !toRemove.includes(g.publicId));
    }
    const newFiles = getFiles(files, 'galleryFiles');
    for (const gf of newFiles) {
      const r = await uploadBuffer(gf.buffer, { folder: `${ROOT}/${folder}/gallery` });
      item.galleryImages = item.galleryImages || [];
      item.galleryImages.push({ url: r.secure_url, publicId: r.public_id });
    }
  }

  /* ── GET / (paginated list) ── */
  router.get('/', auth, async (req, res) => {
    try {
      const { district, assembly, q, ownerPhone, page = 1, limit = 50 } = req.query;
      const filter = {};
      if (district) filter.district = district;
      if (assembly) filter.assembly = assembly;
      if (ownerPhone) filter.ownerPhone = String(ownerPhone).replace(/\D/g, '');
      if (q) {
        const term = String(q).trim();
        const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex specials
        const rx = new RegExp(safe, 'i');
        // Search by business name OR listing code (e.g. "LIST001" or "001")
        filter.$or = [{ name: rx }, { listingCode: rx }];
      }
      const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(200, parseInt(limit));
      const take = Math.min(200, parseInt(limit));
      const [items, total] = await Promise.all([
        // FIX L5: Exclude ownerPin (bcrypt hash) and __v from listing responses
        Model.find(filter).select('-ownerPin -__v').sort({ createdAt: -1 }).skip(skip).limit(take).lean().maxTimeMS(15000),
        Model.countDocuments(filter).maxTimeMS(15000),
      ]);
      res.json({ items, total, page: parseInt(page), limit: take });
    } catch (err) {
      console.error('[listing.list]', err.message);
      res.status(500).json({ error: safeError(err) });
    }
  });

  /* ── GET /:id ── */
  router.get('/:id', auth, async (req, res) => {
    try {
      const item = await Model.findById(req.params.id).lean();
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json({ item });
    } catch (err) {
      res.status(500).json({ error: safeError(err) });
    }
  });

  /* ── POST / (create) ── */
  router.post('/', auth, uploader, async (req, res) => {
    try {
      const { name, description, district, assembly, active } = req.body;
      if (!name) return res.status(400).json({ error: 'name is required' });
      const doc = {
        name: name.trim(),
        description: (description || '').trim(),
        district: (district || '').trim(),
        assembly: (assembly || '').trim(),
        active: active === 'false' ? false : true,
      };
      applySimpleFields(doc, req.body, extraFields);

      const imgFile = getFile(req, 'image');
      if (onBeforeCreate) await onBeforeCreate(doc, req);

      // Resolve phone for per-person folder routing
      const phone = getPhone ? getPhone(doc, req) : null;
      const uploadBuffer = resolveUpload(phone);

      if (perItemFolder) {
        const created = await Model.create(doc);
        if (imgFile) {
          const r = await uploadBuffer(imgFile.buffer, { folder: `${ROOT}/${folder}/${created._id}` });
          created.image = r.secure_url; created.imagePublicId = r.public_id;
          await created.save();
        }
        return res.json({ item: created });
      }
      if (imgFile) {
        const r = await uploadBuffer(imgFile.buffer, { folder: `${ROOT}/${folder}` });
        doc.image = r.secure_url; doc.imagePublicId = r.public_id;
      }
      const created = await Model.create(doc); // onBeforeCreate already called above for non-perItemFolder path
      if (multiImage) {
        const coverFile = getFile(req, 'coverImageFile');
        if (coverFile) {
          const r = await uploadBuffer(coverFile.buffer, { folder: `${ROOT}/${folder}` });
          created.coverImage = r.secure_url; created.coverImagePublicId = r.public_id;
        }
        await applyGallery(created, req.body, req, uploadBuffer);
        await applyServices(created, req.body, req, uploadBuffer);
        await created.save();
      }
      res.json({ item: created });
    } catch (err) {
      console.error('[listing.create]', err);
      res.status(500).json({ error: safeError(err) });
    }
  });

  /* ── PUT /:id (update) ── */
  router.put('/:id', auth, uploader, async (req, res) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });

      const { name, description, district, assembly, active } = req.body;
      if (name !== undefined) item.name = name.trim();
      if (description !== undefined) item.description = description;
      if (district !== undefined) item.district = district.trim();
      if (assembly !== undefined) item.assembly = assembly.trim();
      if (active !== undefined) item.active = active === 'true' || active === true;
      applySimpleFields(item, req.body, extraFields);

      // Resolve phone for per-person folder routing
      const phone = getPhone ? getPhone(item, req) : null;
      const uploadBuffer = resolveUpload(phone);

      const imgFile = getFile(req, 'image');
      if (imgFile) {
        if (item.imagePublicId) await destroy(item.imagePublicId).catch(() => {});
        const imgFolder = perItemFolder ? `${ROOT}/${folder}/${item._id}` : `${ROOT}/${folder}`;
        const r = await uploadBuffer(imgFile.buffer, { folder: imgFolder });
        item.image = r.secure_url; item.imagePublicId = r.public_id;
      }
      if (multiImage) {
        const coverFile = getFile(req, 'coverImageFile');
        if (coverFile) {
          if (item.coverImagePublicId) await destroy(item.coverImagePublicId).catch(() => {});
          const r = await uploadBuffer(coverFile.buffer, { folder: `${ROOT}/${folder}` });
          item.coverImage = r.secure_url; item.coverImagePublicId = r.public_id;
        }
        await applyGallery(item, req.body, req, uploadBuffer);
        await applyServices(item, req.body, req, uploadBuffer);
      }
      await item.save();
      res.json({ item });
    } catch (err) {
      console.error('[listing.update]', err);
      res.status(500).json({ error: safeError(err) });
    }
  });

  /* ── DELETE /:id ── */
  router.delete('/:id', auth, async (req, res) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) return res.json({ ok: true });

      // Delete images from Cloudinary
      if (perItemFolder && deleteByPrefix) {
        await deleteByPrefix(`${ROOT}/${folder}/${item._id}`).catch(() => {});
      } else {
        if (item.imagePublicId) await destroy(item.imagePublicId).catch(() => {});
        if (item.coverImagePublicId) await destroy(item.coverImagePublicId).catch(() => {});
        for (const g of (item.galleryImages || [])) if (g.publicId) await destroy(g.publicId).catch(() => {});
        for (const s of (item.services || [])) if (s.imagePublicId) await destroy(s.imagePublicId).catch(() => {});
      }

      // If this is a Business, also clean up related data (but NOT the member/user)
      if (folder === 'businesses') {
        try {
          const mongoose = require('mongoose');
          const Review = require('../models/Review');
          const { getMemberModel, getVaniganUserModel } = require('../services/memberDb');

          // Delete all reviews on this business
          await Review.deleteMany({ targetKind: 'business', targetId: item._id }).catch(() => {});

          // Remove this business from others' following / savedBusinesses
          const bizOid = new mongoose.Types.ObjectId(item._id.toString());
          const [VM, VU] = await Promise.all([getMemberModel(), getVaniganUserModel()]);
          await VM.updateMany({ following: bizOid },       { $pull: { following: bizOid } }).catch(() => {});
          await VM.updateMany({ savedBusinesses: bizOid }, { $pull: { savedBusinesses: bizOid } }).catch(() => {});
          await VU.updateMany({ following: bizOid },       { $pull: { following: bizOid } }).catch(() => {});
          await VU.updateMany({ savedBusinesses: bizOid }, { $pull: { savedBusinesses: bizOid } }).catch(() => {});

          // Unlink businessId from the owner's member/user record
          if (item.ownerPhone) {
            await VM.updateOne({ phone: item.ownerPhone }, { $unset: { businessId: '' } }).catch(() => {});
            await VU.updateOne({ phone: item.ownerPhone }, { $unset: { businessId: '' } }).catch(() => {});
          }
        } catch (e) {
          console.warn('[listing.delete] business cleanup error:', e.message);
        }
      }

      await item.deleteOne();
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: safeError(err) });
    }
  });

  return router;
}

module.exports = listingRouter;
