const express = require('express');
const auth = require('../middleware/auth');
const { getWingModel } = require('../services/memberDb');
const safeError = require('../utils/safeError');

const router = express.Router();

// GET /api/wings
router.get('/', auth, async (req, res) => {
  try {
    const Wing = await getWingModel();
    const items = await Wing.find({}).sort({ name: 1 }).lean();
    res.json({ wings: items });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

// POST /api/wings
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const Wing = await getWingModel();
    const item = await Wing.create({ name: name.trim() });
    res.status(201).json({ ok: true, wing: item });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'This wing already exists.' });
    }
    res.status(500).json({ error: safeError(err) });
  }
});

// DELETE /api/wings/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const Wing = await getWingModel();
    const item = await Wing.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Wing not found' });
    }
    res.json({ ok: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

module.exports = router;
