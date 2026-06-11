const express = require('express');
const multer  = require('multer');
const auth    = require('../middleware/auth');
const GalleryEvent = require('../models/GalleryEvent');
const { uploadBuffer, destroy } = require('../services/galleryCloudinary');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
});

/* ── GET /api/gallery  (public — no auth required) ──────────────────────── */
router.get('/', async (_req, res) => {
  try {
    const events = await GalleryEvent.find({ active: true })
      .sort({ eventDate: -1 })
      .lean();
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/gallery/all  (admin — includes inactive) ──────────────────── */
router.get('/all', auth, async (_req, res) => {
  try {
    const events = await GalleryEvent.find().sort({ eventDate: -1 }).lean();
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/gallery  (create new event with images) ──────────────────── */
router.post('/', auth, upload.array('images', 20), async (req, res) => {
  try {
    const { eventName, description, eventDate } = req.body;
    if (!eventName) return res.status(400).json({ error: 'eventName is required' });
    if (!eventDate) return res.status(400).json({ error: 'eventDate is required' });

    const files = req.files || [];
    const uploadedImages = [];

    for (const file of files) {
      const result = await uploadBuffer(file.buffer, { folder: 'vanigan_gallery' });
      uploadedImages.push({ url: result.secure_url, publicId: result.public_id });
    }

    const event = await GalleryEvent.create({
      eventName,
      description: description || '',
      eventDate:   new Date(eventDate),
      images:      uploadedImages,
    });

    res.status(201).json({ ok: true, event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── PUT /api/gallery/:id  (update event metadata) ──────────────────────── */
router.put('/:id', auth, async (req, res) => {
  try {
    const { eventName, description, eventDate, active } = req.body;
    const updates = {};
    if (eventName  !== undefined) updates.eventName   = eventName;
    if (description !== undefined) updates.description = description;
    if (eventDate  !== undefined) updates.eventDate   = new Date(eventDate);
    if (active     !== undefined) updates.active      = active === true || active === 'true';

    const event = await GalleryEvent.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ ok: true, event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/gallery/:id/images  (add images to existing event) ────────── */
router.post('/:id/images', auth, upload.array('images', 20), async (req, res) => {
  try {
    const event = await GalleryEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: 'No images provided' });

    for (const file of files) {
      const result = await uploadBuffer(file.buffer, { folder: 'vanigan_gallery' });
      event.images.push({ url: result.secure_url, publicId: result.public_id });
    }

    await event.save();
    res.json({ ok: true, event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── DELETE /api/gallery/:id/images/:publicId  (remove single image) ─────── */
router.delete('/:id/images/:publicId', auth, async (req, res) => {
  try {
    const event = await GalleryEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // publicId may contain slashes — client should encode it
    const pid = decodeURIComponent(req.params.publicId);
    const img  = event.images.find((i) => i.publicId === pid);
    if (!img) return res.status(404).json({ error: 'Image not found' });

    await destroy(pid);
    event.images = event.images.filter((i) => i.publicId !== pid);
    await event.save();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── DELETE /api/gallery/:id  (delete entire event + all its images) ────── */
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await GalleryEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    for (const img of event.images) {
      await destroy(img.publicId).catch(() => {});
    }
    await GalleryEvent.deleteOne({ _id: req.params.id });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
