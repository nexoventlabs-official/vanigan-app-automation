const express = require('express');
const auth = require('../middleware/auth');
const Review = require('../models/Review');
const Business = require('../models/Business');
const { getOrganizerModel, getMemberListingModel } = require('../services/memberDb');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const Organizer = await getOrganizerModel();
    const Member = await getMemberListingModel();
    const MODELS = { business: Business, organizer: Organizer, member: Member };

    const { kind, targetId } = req.query;
    const filter = {};
    if (kind && MODELS[kind]) filter.targetKind = kind;
    if (targetId) filter.targetId = targetId;
    const reviews = await Review.find(filter).sort({ createdAt: -1 }).limit(500).lean();

    // Hydrate target name for the table
    const idsByKind = reviews.reduce((acc, r) => {
      (acc[r.targetKind] = acc[r.targetKind] || []).push(r.targetId);
      return acc;
    }, {});
    const nameMap = {};
    for (const [k, ids] of Object.entries(idsByKind)) {
      const M = MODELS[k];
      if (!M) continue;
      const docs = await M.find({ _id: { $in: ids } }, { name: 1 }).lean();
      docs.forEach((d) => (nameMap[`${k}:${d._id}`] = d.name));
    }

    const hydrated = reviews.map((r) => ({
      ...r,
      targetName: nameMap[`${r.targetKind}:${r.targetId}`] || '(deleted)',
    }));
    res.json({ reviews: hydrated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
