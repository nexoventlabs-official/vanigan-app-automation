/**
 * Vanigan website user auth routes.
 *
 * POST /api/web-auth/signup   — register new user
 * POST /api/web-auth/login    — login (phone + PIN)
 * GET  /api/web-auth/me       — get current user profile + business info
 * POST /api/web-auth/link-business — link a business to the user account
 */
const express  = require('express');
const bcrypt   = require('bcryptjs');
const Business = require('../models/Business');
const VaniganUser = require('../models/VaniganUser');

const router = express.Router();

/* ── POST /api/web-auth/signup ── */
router.post('/signup', async (req, res) => {
  try {
    const {
      phone, pin, confirmPin, name,
      district, assembly, bizCategory, bizSubCat,
    } = req.body;

    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length < 10) return res.status(400).json({ error: 'Valid 10-digit phone is required.' });
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name is required.' });
    if (!/^\d{4}$/.test(String(pin || ''))) return res.status(400).json({ error: 'PIN must be exactly 4 digits.' });
    if (String(pin) !== String(confirmPin)) return res.status(400).json({ error: 'PINs do not match.' });

    const exists = await VaniganUser.findOne({ phone: digits });
    if (exists) return res.status(409).json({ error: 'phone_exists', message: 'An account with this number already exists. Please login.' });

    const pinHash = await bcrypt.hash(String(pin), 10);

    const user = await VaniganUser.create({
      phone:       digits,
      name:        String(name).trim(),
      pinHash,
      district:    String(district || '').trim(),
      assembly:    String(assembly || '').trim(),
      bizCategory: String(bizCategory || '').trim(),
      bizSubCat:   String(bizSubCat || '').trim(),
    });

    // Check if business already exists for this phone (from WhatsApp registration)
    const biz = await Business.findOne({ ownerPhone: digits }).lean();
    if (biz) {
      user.businessId = biz._id;
      // Sync PIN to business ownerPin if not already set
      if (!biz.ownerPin) {
        await Business.findByIdAndUpdate(biz._id, { ownerPin: pinHash });
      }
      await user.save();
    }

    const { pinHash: _, ...safeUser } = user.toObject();
    res.json({
      user: safeUser,
      business: biz ? (() => { const { ownerPin, ownerPhone, ...safe } = biz; return safe; })() : null,
    });
  } catch (err) {
    console.error('[web-auth/signup]', err);
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/web-auth/login ── */
router.post('/login', async (req, res) => {
  try {
    const { phone, pin } = req.body;
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits || !/^\d{4}$/.test(String(pin || ''))) {
      return res.status(400).json({ error: 'Phone and 4-digit PIN are required.' });
    }

    const user = await VaniganUser.findOne({ phone: digits });
    if (!user) return res.status(404).json({ error: 'no_account', message: 'No account found. Please sign up first.' });

    const ok = await bcrypt.compare(String(pin), user.pinHash);
    if (!ok) return res.status(403).json({ error: 'wrong_pin', message: 'Incorrect PIN. Please try again.' });

    // Refresh businessId in case they registered a business after signup
    const biz = await Business.findOne({ ownerPhone: digits }).lean();
    if (biz && !user.businessId) {
      user.businessId = biz._id;
      // Sync PIN to business if not set
      if (!biz.ownerPin) {
        await Business.findByIdAndUpdate(biz._id, { ownerPin: user.pinHash });
      }
      await user.save();
    }

    const { pinHash: _, ...safeUser } = user.toObject();

    let safeBiz = null;
    if (biz) {
      const { ownerPin, ownerPhone, ...safe } = biz;
      // Fetch reviews for the business
      const Review = require('../models/Review');
      const mongoose = require('mongoose');
      const reviews = await Review.find({ targetKind: 'business', targetId: biz._id })
        .sort({ createdAt: -1 }).lean();
      const avgAgg = await Review.aggregate([
        { $match: { targetKind: 'business', targetId: new mongoose.Types.ObjectId(biz._id.toString()) } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      safeBiz = {
        ...safe,
        reviews,
        rating: avgAgg[0] ? parseFloat(avgAgg[0].avg.toFixed(1)) : 0,
        reviewCount: avgAgg[0] ? avgAgg[0].count : 0,
      };
    }

    res.json({ user: safeUser, business: safeBiz });
  } catch (err) {
    console.error('[web-auth/login]', err);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/web-auth/me?phone=XXXXXXXXXX ── */
router.get('/me', async (req, res) => {
  try {
    const digits = String(req.query.phone || '').replace(/\D/g, '');
    if (!digits) return res.status(400).json({ error: 'phone required' });

    const user = await VaniganUser.findOne({ phone: digits }).lean();
    if (!user) return res.status(404).json({ error: 'not_found' });

    const biz = await Business.findOne({ ownerPhone: digits }).lean();
    const { pinHash: _, ...safeUser } = user;

    let safeBiz = null;
    if (biz) {
      const { ownerPin, ownerPhone, ...safe } = biz;
      const Review = require('../models/Review');
      const mongoose = require('mongoose');
      const reviews = await Review.find({ targetKind: 'business', targetId: biz._id })
        .sort({ createdAt: -1 }).lean();
      const avgAgg = await Review.aggregate([
        { $match: { targetKind: 'business', targetId: new mongoose.Types.ObjectId(biz._id.toString()) } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      safeBiz = {
        ...safe,
        reviews,
        rating: avgAgg[0] ? parseFloat(avgAgg[0].avg.toFixed(1)) : 0,
        reviewCount: avgAgg[0] ? avgAgg[0].count : 0,
      };
    }

    res.json({ user: safeUser, business: safeBiz });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/web-auth/link-business — called after adding a new business ── */
router.post('/link-business', async (req, res) => {
  try {
    const { phone, businessId } = req.body;
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits || !businessId) return res.status(400).json({ error: 'phone and businessId required' });

    const user = await VaniganUser.findOne({ phone: digits });
    if (!user) return res.status(404).json({ error: 'no_account' });

    user.businessId = businessId;
    await user.save();

    // Sync user PIN to the business ownerPin if business has no PIN yet
    const biz = await Business.findById(businessId);
    if (biz && !biz.ownerPin) {
      biz.ownerPin = user.pinHash;
      await biz.save();
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/web-auth/check-phone?phone=XXXXXXXXXX — check if account exists ── */
router.get('/check-phone', async (req, res) => {
  try {
    const digits = String(req.query.phone || '').replace(/\D/g, '');
    if (!digits) return res.status(400).json({ error: 'phone required' });
    const user = await VaniganUser.findOne({ phone: digits }).select('_id name phone').lean();
    res.json({ exists: !!user, name: user?.name || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
