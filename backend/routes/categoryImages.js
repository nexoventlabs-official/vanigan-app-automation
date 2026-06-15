const express = require('express');
const multer  = require('multer');
const auth    = require('../middleware/auth');
const CategoryImage = require('../models/CategoryImage');
const { uploadBuffer, destroy } = require('../services/cloudinary');
const CATEGORIES = require('../services/categories');
const safeError = require('../utils/safeError');

const router = express.Router();
// FIX 4.4: fileFilter restricts to images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'));
    }
    cb(null, true);
  },
});

/* ── GET /api/category-images  ─────────────────────────────── */
router.get('/', async (_req, res) => {
  try {
    const docs = await CategoryImage.find({ category: { $in: CATEGORIES } }).lean();
    const map  = {};
    docs.forEach((d) => { map[d.category] = d; });

    const images = CATEGORIES.map((c) => ({
      category: c,
      imageUrl: map[c]?.imageUrl || '',
      publicId: map[c]?.publicId || '',
    }));
    res.json({ images });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

/* ── POST /api/category-images/:category  (upload / replace) ─ */
router.post('/:category', auth, upload.single('image'), async (req, res) => {
  try {
    const { category } = req.params;
    if (!CATEGORIES.includes(category))
      return res.status(400).json({ error: 'Unknown category' });
    if (!req.file)
      return res.status(400).json({ error: 'No image provided' });

    const existing = await CategoryImage.findOne({ category }).lean();
    if (existing?.publicId) await destroy(existing.publicId).catch(() => {});

    const safeId = category.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const result = await uploadBuffer(req.file.buffer, {
      folder:   'vanigan/categories',
      publicId: `category_${safeId}`,
    });

    await CategoryImage.findOneAndUpdate(
      { category },
      { $set: { imageUrl: result.secure_url, publicId: result.public_id } },
      { upsert: true, new: true }
    );

    res.json({ ok: true, imageUrl: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

/* ── DELETE /api/category-images/:category  ─────────────────── */
router.delete('/:category', auth, async (req, res) => {
  try {
    const { category } = req.params;
    const doc = await CategoryImage.findOne({ category }).lean();
    if (doc?.publicId) await destroy(doc.publicId).catch(() => {});
    await CategoryImage.updateOne({ category }, { $set: { imageUrl: '', publicId: '' } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

module.exports = router;
