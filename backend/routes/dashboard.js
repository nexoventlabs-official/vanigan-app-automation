const express = require('express');
const auth = require('../middleware/auth');
const Business = require('../models/Business');
const Plan = require('../models/Plan');
const Review = require('../models/Review');
const User = require('../models/User');
const InboundMessage = require('../models/InboundMessage');
const { getOrganizerModel, getMemberListingModel, getMemberModel } = require('../services/memberDb');
const safeError = require('../utils/safeError');

const router = express.Router();

router.get('/referrals', auth, async (_req, res) => {
  try {
    const VaniganMember = await getMemberModel();
    const members = await VaniganMember.find({})
      .select('name phone membershipId referralCode referredBy referralCount photoUrl createdAt bizName bizCategory district assemblyName zone isOrganizer')
      .sort({ name: 1 })
      .lean();
    res.json({ members });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

router.get('/stats', auth, async (_req, res) => {
  try {
    const Organizer = await getOrganizerModel();
    const Member = await getMemberListingModel();
    const [businesses, organizers, members, plans, reviews, users, contacts] = await Promise.all([
      Business.countDocuments({ active: true }),
      Organizer.countDocuments({ active: true }),
      Member.countDocuments({ active: true }),
      Plan.countDocuments({ active: true }),
      Review.countDocuments(),
      User.countDocuments(),
      InboundMessage.countDocuments(),
    ]);

    const recentReviews = await Review.find().sort({ createdAt: -1 }).limit(5).lean();
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).lean();

    res.json({
      stats: { businesses, organizers, members, plans, reviews, users, contacts },
      recentReviews,
      recentUsers,
    });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

module.exports = router;
