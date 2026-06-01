const express = require('express');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const defaultCloud = require('../services/cloudinary');

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
 */
function listingRouter({ Model, folder, extraFields = [], multiImage = false, cloudinaryService, perItemFolder = false, onBeforeCreate }) {
  const { uploadBuffer, destroy, ROOT, deleteByPrefix } = cloudinaryService || defaultCloud;
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

  async function applyServices(item, body, files) {
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

  async function applyGallery(item, body, files) {
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
      const { district, assembly, q, page = 1, limit = 50 } = req.query;
      const filter = {};
      if (district) filter.district = district;
      if (assembly) filter.assembly = assembly;
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
        Model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(take).lean().maxTimeMS(15000),
        Model.countDocuments(filter).maxTimeMS(15000),
      ]);
      res.json({ items, total, page: parseInt(page), limit: take });
    } catch (err) {
      console.error('[listing.list]', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  /* ── GET /:id ── */
  router.get('/:id', auth, async (req, res) => {
    try {
      const item = await Model.findById(req.params.id).lean();
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json({ item });
    } catch (err) {
      res.status(500).json({ error: err.message });
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
        await applyGallery(created, req.body, req);
        await applyServices(created, req.body, req);
        await created.save();
      }
      res.json({ item: created });
    } catch (err) {
      console.error('[listing.create]', err);
      res.status(500).json({ error: err.message });
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
        await applyGallery(item, req.body, req);
        await applyServices(item, req.body, req);
      }
      await item.save();
      res.json({ item });
    } catch (err) {
      console.error('[listing.update]', err);
      res.status(500).json({ error: err.message });
    }
  });

  /* ── DELETE /:id ── */
  router.delete('/:id', auth, async (req, res) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) return res.json({ ok: true });
      if (perItemFolder && deleteByPrefix) {
        await deleteByPrefix(`${ROOT}/${folder}/${item._id}`).catch(() => {});
      } else {
        if (item.imagePublicId) await destroy(item.imagePublicId).catch(() => {});
        if (item.coverImagePublicId) await destroy(item.coverImagePublicId).catch(() => {});
        for (const g of (item.galleryImages || [])) if (g.publicId) await destroy(g.publicId).catch(() => {});
        for (const s of (item.services || [])) if (s.imagePublicId) await destroy(s.imagePublicId).catch(() => {});
      }
      await item.deleteOne();
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = listingRouter;
