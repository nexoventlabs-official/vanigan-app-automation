/**
 * social.js
 * Follow / Save (favourite) business endpoints for logged-in users.
 * Works for both VaniganMember (new flow) and VaniganUser (legacy).
 *
 * POST /api/social/follow   { phone, businessId }  → toggle follow
 * POST /api/social/save     { phone, businessId }  → toggle save
 * GET  /api/social/profile?phone=                  → full profile with counts + lists
 */
const express  = require('express');
const mongoose = require('mongoose');
const Business = require('../models/Business');
const { getMemberModel, getVaniganUserModel } = require('../services/memberDb');

const router = express.Router();

/* ── helpers ── */
async function findUser(phone) {
  // Try VaniganMember first, then VaniganUser
  const VaniganMember = await getMemberModel();
  const member = await VaniganMember.findOne({ phone });
  if (member) return { doc: member, type: 'member' };

  const VaniganUser = await getVaniganUserModel();
  const user = await VaniganUser.findOne({ phone });
  if (user) return { doc: user, type: 'user' };

  return null;
}

/* ── POST /api/social/follow ── */
router.post('/follow', async (req, res) => {
  try {
    const { phone, businessId } = req.body;
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits || !businessId) return res.status(400).json({ error: 'phone and businessId required' });

    const bizOid = new mongoose.Types.ObjectId(businessId);
    const found  = await findUser(digits);
    if (!found) return res.status(404).json({ error: 'no_account' });

    const { doc } = found;
    const following = doc.following || [];
    const idx = following.findIndex(id => id.toString() === bizOid.toString());
    let followed;
    if (idx === -1) {
      following.push(bizOid);
      followed = true;
    } else {
      following.splice(idx, 1);
      followed = false;
    }
    doc.following = following;
    await doc.save();

    res.json({ ok: true, followed, followingCount: following.length });
  } catch (err) {
    console.error('[social/follow]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/social/save ── */
router.post('/save', async (req, res) => {
  try {
    const { phone, businessId } = req.body;
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits || !businessId) return res.status(400).json({ error: 'phone and businessId required' });

    const bizOid = new mongoose.Types.ObjectId(businessId);
    const found  = await findUser(digits);
    if (!found) return res.status(404).json({ error: 'no_account' });

    const { doc } = found;
    const saved = doc.savedBusinesses || [];
    const idx = saved.findIndex(id => id.toString() === bizOid.toString());
    let isSaved;
    if (idx === -1) {
      saved.push(bizOid);
      isSaved = true;
    } else {
      saved.splice(idx, 1);
      isSaved = false;
    }
    doc.savedBusinesses = saved;
    await doc.save();

    res.json({ ok: true, saved: isSaved, savedCount: saved.length });
  } catch (err) {
    console.error('[social/save]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/social/profile?phone= ── */
router.get('/profile', async (req, res) => {
  try {
    const digits = String(req.query.phone || '').replace(/\D/g, '');
    if (!digits) return res.status(400).json({ error: 'phone required' });

    const found = await findUser(digits);
    if (!found) return res.status(404).json({ error: 'no_account' });

    const { doc, type } = found;
    const raw = doc.toObject ? doc.toObject() : { ...doc };
    delete raw.pinHash;

    // Populate following businesses (name, category, image, district, assembly)
    const followingIds = (raw.following || []);
    const savedIds     = (raw.savedBusinesses || []);

    const [followingBiz, savedBiz, followers] = await Promise.all([
      followingIds.length
        ? Business.find({ _id: { $in: followingIds } })
            .select('name category subCategory image district assembly active listingCode')
            .lean()
        : [],
      savedIds.length
        ? Business.find({ _id: { $in: savedIds } })
            .select('name category subCategory image district assembly active listingCode phone whatsappNo')
            .lean()
        : [],
      // Count how many other users follow this user's business
      (async () => {
        if (!raw.businessId) return 0;
        const VaniganMember = await getMemberModel();
        const VaniganUser   = await getVaniganUserModel();
        const bizOid = new mongoose.Types.ObjectId(raw.businessId.toString());
        const [mc, uc] = await Promise.all([
          VaniganMember.countDocuments({ following: bizOid }),
          VaniganUser.countDocuments({ following: bizOid }),
        ]);
        return mc + uc;
      })(),
    ]);

    res.json({
      profile: {
        ...raw,
        type,
        followingCount:  followingIds.length,
        savedCount:      savedIds.length,
        followerCount:   followers,
        followingList:   followingBiz,
        savedList:       savedBiz,
      },
    });
  } catch (err) {
    console.error('[social/profile]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
