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
            .select('name category subCategory image district assembly active listingCode ownerPhone ownerName')
            .lean()
        : [],
      savedIds.length
        ? Business.find({ _id: { $in: savedIds } })
            .select('name category subCategory image district assembly active listingCode phone whatsappNo ownerPhone ownerName')
            .lean()
        : [],
      // Count + list how many other users follow this user's business
      (async () => {
        if (!raw.businessId) return { count: 0, list: [] };
        const VaniganMember = await getMemberModel();
        const VaniganUser   = await getVaniganUserModel();
        const bizOid = new mongoose.Types.ObjectId(raw.businessId.toString());
        const [members, users] = await Promise.all([
          VaniganMember.find({ following: bizOid }).select('name phone photoUrl district assemblyName membershipId businessId').lean(),
          VaniganUser.find({ following: bizOid }).select('name phone district assembly businessId').lean(),
        ]);
        // Merge & normalise shape
        const allFollowers = [
          ...members.map(m => ({ _id: m._id, name: m.name, phone: m.phone, photoUrl: m.photoUrl || '', location: [m.assemblyName, m.district].filter(Boolean).join(', '), membershipId: m.membershipId || '', businessId: m.businessId || null })),
          ...users.map(u => ({ _id: u._id, name: u.name, phone: u.phone, photoUrl: '', location: [u.assembly, u.district].filter(Boolean).join(', '), membershipId: '', businessId: u.businessId || null })),
        ];
        // Enrich with their business details
        const bizIds = allFollowers.map(f => f.businessId).filter(Boolean);
        let bizMap = {};
        if (bizIds.length) {
          const bizDocs = await Business.find({ _id: { $in: bizIds } })
            .select('name category subCategory image district assembly active listingCode').lean();
          bizDocs.forEach(b => { bizMap[b._id.toString()] = b; });
        }
        const list = allFollowers.map(f => ({
          ...f,
          business: f.businessId ? (bizMap[f.businessId.toString()] || null) : null,
        }));
        return { count: list.length, list };
      })(),
    ]);

    // Enrich followingBiz with owner profile (photo, membershipId)
    let enrichedFollowing = followingBiz;
    if (followingBiz.length) {
      const ownerPhones = [...new Set(followingBiz.map(b => b.ownerPhone).filter(Boolean))];
      const VaniganMember = await getMemberModel();
      const VaniganUser   = await getVaniganUserModel();
      const [memberOwners, userOwners] = await Promise.all([
        VaniganMember.find({ phone: { $in: ownerPhones } }).select('name phone photoUrl membershipId district assemblyName').lean(),
        VaniganUser.find({ phone: { $in: ownerPhones } }).select('name phone district assembly').lean(),
      ]);
      const ownerMap = {};
      userOwners.forEach(u => { ownerMap[u.phone] = { name: u.name, photoUrl: '', membershipId: '', location: [u.assembly, u.district].filter(Boolean).join(', ') }; });
      memberOwners.forEach(m => { ownerMap[m.phone] = { name: m.name, photoUrl: m.photoUrl || '', membershipId: m.membershipId || '', location: [m.assemblyName, m.district].filter(Boolean).join(', ') }; });
      enrichedFollowing = followingBiz.map(b => ({ ...b, owner: ownerMap[b.ownerPhone] || null }));
    }

    res.json({
      profile: {
        ...raw,
        type,
        followingCount:  followingIds.length,
        savedCount:      savedIds.length,
        followerCount:   followers.count,
        followerList:    followers.list,
        followingList:   enrichedFollowing,
        savedList:       savedBiz,
      },
    });
  } catch (err) {
    console.error('[social/profile]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/social/biz-by-phone?phone= — find business owned by this phone ── */
router.get('/biz-by-phone', async (req, res) => {
  try {
    const digits = String(req.query.phone || '').replace(/\D/g, '');
    if (!digits) return res.status(400).json({ error: 'phone required' });
    const biz = await Business.findOne({ ownerPhone: digits, active: true }).select('_id name category image district assembly').lean();
    if (!biz) return res.json({ found: false });
    res.json({ found: true, biz });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
