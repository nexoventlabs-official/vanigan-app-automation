const express = require('express');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const Plan = require('../models/Plan');
const { uploadBuffer, destroy, ROOT } = require('../services/cloudinary');

const router = express.Router();

const ALLOWED_CODES = ['free', 'premium', 'premium_plus'];

router.get('/', auth, async (_req, res) => {
  const plans = await Plan.find({}).sort({ sortOrder: 1, createdAt: 1 }).lean();
  res.json({ plans });
});

router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { code, name, description, priceLabel, features, sortOrder, active } = req.body;
    if (!code || !ALLOWED_CODES.includes(code)) {
      return res.status(400).json({ error: `code must be one of ${ALLOWED_CODES.join(', ')}` });
    }
    if (!name) return res.status(400).json({ error: 'name is required' });

    const featuresArr =
      typeof features === 'string'
        ? features.split(/\r?\n|\|/).map((s) => s.trim()).filter(Boolean)
        : Array.isArray(features)
        ? features
        : [];

    const doc = {
      code,
      name: name.trim(),
      description: (description || '').trim(),
      priceLabel: (priceLabel || '').trim(),
      features: featuresArr,
      sortOrder: parseInt(sortOrder, 10) || 0,
      active: active === 'false' ? false : true,
    };
    if (req.file) {
      const result = await uploadBuffer(req.file.buffer, { folder: `${ROOT}/plans` });
      doc.image = result.secure_url;
      doc.imagePublicId = result.public_id;
    }

    const plan = await Plan.findOneAndUpdate({ code }, { $set: doc }, { upsert: true, new: true });
    res.json({ plan });
  } catch (err) {
    console.error('[plans.create]', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Not found' });

    const { name, description, priceLabel, features, sortOrder, active } = req.body;
    if (name !== undefined) plan.name = name.trim();
    if (description !== undefined) plan.description = description;
    if (priceLabel !== undefined) plan.priceLabel = priceLabel;
    if (sortOrder !== undefined) plan.sortOrder = parseInt(sortOrder, 10) || 0;
    if (active !== undefined) plan.active = active === 'true' || active === true;
    if (features !== undefined) {
      plan.features =
        typeof features === 'string'
          ? features.split(/\r?\n|\|/).map((s) => s.trim()).filter(Boolean)
          : Array.isArray(features)
          ? features
          : [];
    }

    if (req.file) {
      if (plan.imagePublicId) await destroy(plan.imagePublicId).catch(() => {});
      const result = await uploadBuffer(req.file.buffer, { folder: `${ROOT}/plans` });
      plan.image = result.secure_url;
      plan.imagePublicId = result.public_id;
    }
    await plan.save();
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.json({ ok: true });
    if (plan.imagePublicId) await destroy(plan.imagePublicId).catch(() => {});
    await plan.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
