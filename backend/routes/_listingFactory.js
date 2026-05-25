const express = require('express');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadBuffer, destroy, ROOT } = require('../services/cloudinary');

/**
 * Build a CRUD router for Business / Organizer / Member listings.
 *
 * `extraFields` is the list of optional non-required body fields specific
 * to that listing type (e.g. ['category', 'address', 'phone'] for business).
 * Common fields (`name`, `description`, `district`, `assembly`, `active`,
 * `image`) are always supported.
 */
function listingRouter({ Model, folder, extraFields = [] }) {
  const router = express.Router();

  router.get('/', auth, async (req, res) => {
    try {
      const { district, assembly, q } = req.query;
      const filter = {};
      if (district) filter.district = district;
      if (assembly) filter.assembly = assembly;
      if (q) filter.name = new RegExp(String(q).trim(), 'i');
      const items = await Model.find(filter).sort({ createdAt: -1 }).lean();
      res.json({ items });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:id', auth, async (req, res) => {
    try {
      const item = await Model.findById(req.params.id).lean();
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json({ item });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
      const { name, description, district, assembly, active } = req.body;
      if (!name || !district || !assembly) {
        return res.status(400).json({ error: 'name, district, assembly required' });
      }
      const doc = {
        name: name.trim(),
        description: (description || '').trim(),
        district: district.trim(),
        assembly: assembly.trim(),
        active: active === 'false' ? false : true,
      };
      for (const f of extraFields) {
        if (req.body[f] !== undefined) doc[f] = String(req.body[f]).trim();
      }
      if (req.file) {
        const result = await uploadBuffer(req.file.buffer, { folder: `${ROOT}/${folder}` });
        doc.image = result.secure_url;
        doc.imagePublicId = result.public_id;
      }
      const created = await Model.create(doc);
      res.json({ item: created });
    } catch (err) {
      console.error('[listing.create]', err);
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/:id', auth, upload.single('image'), async (req, res) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });

      const { name, description, district, assembly, active } = req.body;
      if (name !== undefined) item.name = name.trim();
      if (description !== undefined) item.description = description;
      if (district !== undefined) item.district = district.trim();
      if (assembly !== undefined) item.assembly = assembly.trim();
      if (active !== undefined) item.active = active === 'true' || active === true;
      for (const f of extraFields) {
        if (req.body[f] !== undefined) item[f] = String(req.body[f]);
      }

      if (req.file) {
        if (item.imagePublicId) await destroy(item.imagePublicId).catch(() => {});
        const result = await uploadBuffer(req.file.buffer, { folder: `${ROOT}/${folder}` });
        item.image = result.secure_url;
        item.imagePublicId = result.public_id;
      }
      await item.save();
      res.json({ item });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/:id', auth, async (req, res) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) return res.json({ ok: true });
      if (item.imagePublicId) await destroy(item.imagePublicId).catch(() => {});
      await item.deleteOne();
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = listingRouter;
