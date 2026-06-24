const express = require('express');
const auth = require('../middleware/auth');
const { getPostingModel } = require('../services/memberDb');
const safeError = require('../utils/safeError');

const router = express.Router();

// GET /api/postings
router.get('/', auth, async (req, res) => {
  try {
    const Posting = await getPostingModel();
    const items = await Posting.find({}).sort({ name: 1 }).lean();
    res.json({ postings: items });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

// POST /api/postings
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const Posting = await getPostingModel();
    const item = await Posting.create({ name: name.trim() });
    res.status(201).json({ ok: true, posting: item });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'This posting/role already exists.' });
    }
    res.status(500).json({ error: safeError(err) });
  }
});

// DELETE /api/postings/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const Posting = await getPostingModel();
    const item = await Posting.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Posting/role not found' });
    }
    res.json({ ok: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

module.exports = router;
