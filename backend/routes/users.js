const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const InboundMessage = require('../models/InboundMessage');
const safeError = require('../utils/safeError');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const filter = q ? { $or: [{ name: new RegExp(q, 'i') }, { phone: new RegExp(q, 'i') }] } : {};
    const users = await User.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

router.get('/contacts', auth, async (_req, res) => {
  try {
    const contacts = await InboundMessage.find({}).sort({ lastSeenAt: -1 }).limit(500).lean();
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const update = {};
    if (req.body.name !== undefined) update.name = String(req.body.name).trim();
    if (req.body.currentPlan && ['free', 'premium', 'premium_plus'].includes(req.body.currentPlan)) {
      update.currentPlan = req.body.currentPlan;
    }
    const user = await User.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

module.exports = router;
