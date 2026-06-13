const express  = require('express');
const mongoose = require('mongoose');
const multer   = require('multer');
const bcrypt   = require('bcryptjs');
const Business = require('../models/Business');
const Review   = require('../models/Review');
const { uploadBuffer: memberUpload, destroy } = require('../services/memberCloudinary');

const router = express.Router();
const PAGE_LIMIT = 60;


/* ── GET /api/public/businesses ── */
router.get('/businesses', async (req, res) => {
  try {
    const { category, subcategory, district, assembly, search, ownerPhone, sort, page = 1 } = req.query;
    const filter = { active: true };
    if (category)                              filter.category    = category;
    if (subcategory && subcategory !== 'All')  filter.subCategory = subcategory;
    if (district)                              filter.district    = district;
    if (assembly)                              filter.assembly    = assembly;
    if (ownerPhone)                            filter.ownerPhone  = String(ownerPhone).replace(/\D/g, '');
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: re }, { description: re }, { address: re }, { serviceLocations: re }, { subCategory: re }];
    }
    /* ── sort=rating: query Review first, then fetch those businesses ── */
    if (sort === 'rating') {
      const topStats = await Review.aggregate([
        { $match: { targetKind: 'business' } },
        { $group: { _id: '$targetId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
        { $sort: { avg: -1, count: -1 } },
        { $limit: PAGE_LIMIT },
      ]).catch(() => []);

      if (topStats.length === 0) {
        return res.json({ businesses: [], total: 0, page: 1, limit: PAGE_LIMIT });
      }

      const topIds    = topStats.map((s) => s._id);
      const statsMap2 = {};
      topStats.forEach((s) => { statsMap2[s._id.toString()] = { avgRating: parseFloat(s.avg.toFixed(1)), reviewCount: s.count }; });

      /* Filter by active + any extra filters (category etc.) the caller may have passed */
      const bizDocs2 = await Business.find({ ...filter, _id: { $in: topIds } })
        .select('-ownerPhone').lean();

      const businesses2 = bizDocs2
        .map((b) => ({ ...b, ...statsMap2[b._id.toString()] }))
        .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0));

      return res.json({ businesses: businesses2, total: businesses2.length, page: 1, limit: PAGE_LIMIT });
    }

    /* ── default path: paginated alphabetical ── */
    const skip = (parseInt(page, 10) - 1) * PAGE_LIMIT;
    const [bizDocs, total] = await Promise.all([
      Business.find(filter)
        .select('-ownerPhone')
        .sort({ name: 1 })
        .skip(skip)
        .limit(PAGE_LIMIT)
        .lean(),
      Business.countDocuments(filter),
    ]);

    const bizIds = bizDocs.map((b) => b._id);
    const stats  = await Review.aggregate([
      { $match: { targetKind: 'business', targetId: { $in: bizIds } } },
      { $group: { _id: '$targetId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]).catch(() => []);
    const statsMap = {};
    stats.forEach((s) => { statsMap[s._id.toString()] = { avgRating: parseFloat(s.avg.toFixed(1)), reviewCount: s.count }; });

    const businesses = bizDocs.map((b) => ({
      ...b,
      avgRating:   statsMap[b._id.toString()]?.avgRating   ?? 0,
      reviewCount: statsMap[b._id.toString()]?.reviewCount ?? 0,
    }));

    res.json({ businesses, total, page: parseInt(page, 10), limit: PAGE_LIMIT });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/public/businesses/:id ── */
router.get('/businesses/:id', async (req, res) => {
  try {
    const biz = await Business.findById(req.params.id).select('-ownerPhone').lean();
    if (!biz) return res.status(404).json({ error: 'Not found' });

    // Fetch and aggregate reviews
    const reviews = await Review.find({ targetKind: 'business', targetId: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    const avgAgg = await Review.aggregate([
      { $match: { targetKind: 'business', targetId: new mongoose.Types.ObjectId(req.params.id) } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    const rating = avgAgg[0] ? avgAgg[0].avg : 0;
    const reviewCount = avgAgg[0] ? avgAgg[0].count : 0;

    res.json({
      ...biz,
      reviews,
      rating: parseFloat(rating.toFixed(1)),
      reviewCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/public/businesses/:id/review ── */
router.post('/businesses/:id/review', async (req, res) => {
  try {
    const { reviewerName, rating, text } = req.body;
    const ratingNum = parseInt(rating, 10);
    if (!reviewerName || !ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Name and a valid rating (1-5 stars) are required.' });
    }

    const phone = req.body.phone ? String(req.body.phone).replace(/\D/g, '') : '';

    /* One review per phone per business */
    if (phone) {
      let oid;
      try { oid = new mongoose.Types.ObjectId(req.params.id); } catch { return res.status(400).json({ error: 'Invalid id' }); }
      const dup = await Review.findOne({ targetKind: 'business', targetId: oid, phone }).lean();
      if (dup) return res.status(409).json({ error: 'already_reviewed' });
    }

    const newReview = await Review.create({
      targetKind:   'business',
      targetId:     req.params.id,
      rating:       ratingNum,
      text:         text ? String(text).trim() : '',
      reviewerName: String(reviewerName).trim(),
      phone,
    });
    res.json(newReview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/public/owner/set-pin  (called once after registration to set 4-digit PIN) ── */
router.post('/owner/set-pin', async (req, res) => {
  try {
    const { ownerPhone, pin } = req.body;
    const digits = String(ownerPhone || '').replace(/\D/g, '');
    if (!digits || !/^\d{4}$/.test(String(pin || ''))) {
      return res.status(400).json({ error: 'ownerPhone and a 4-digit PIN are required.' });
    }
    const biz = await Business.findOne({ ownerPhone: digits });
    if (!biz) {
      console.warn('[set-pin] no business found for phone:', digits);
      return res.status(404).json({ error: 'Business not found. Please complete registration first.' });
    }
    if (biz.ownerPin) return res.status(409).json({ error: 'pin_already_set' });
    biz.ownerPin = await bcrypt.hash(String(pin), 10);
    await biz.save();
    res.json({ ok: true, businessId: biz._id });
  } catch (err) {
    console.error('[owner/set-pin] error:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/public/owner/verify-pin  (look up by phone + validate PIN, returns full biz data) ── */
router.post('/owner/verify-pin', async (req, res) => {
  try {
    const { ownerPhone, pin } = req.body;
    const digits = String(ownerPhone || '').replace(/\D/g, '');
    if (!digits || !/^\d{4}$/.test(String(pin || ''))) {
      return res.status(400).json({ error: 'ownerPhone and a 4-digit PIN are required.' });
    }
    /* find including inactive so owner can see pending status */
    const biz = await Business.findOne({ ownerPhone: digits }).lean();
    if (!biz) return res.status(404).json({ error: 'no_business' });
    if (!biz.ownerPin) return res.status(403).json({ error: 'no_pin_set' });
    const ok = await bcrypt.compare(String(pin), biz.ownerPin);
    if (!ok) return res.status(403).json({ error: 'wrong_pin' });

    /* fetch reviews */
    const reviews = await Review.find({ targetKind: 'business', targetId: biz._id })
      .sort({ createdAt: -1 }).lean();
    const avgAgg = await Review.aggregate([
      { $match: { targetKind: 'business', targetId: new mongoose.Types.ObjectId(biz._id.toString()) } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const { ownerPin: _pin, ownerPhone: _ph, ...safeBiz } = biz;
    res.json({
      ...safeBiz,
      reviews,
      rating: avgAgg[0] ? parseFloat(avgAgg[0].avg.toFixed(1)) : 0,
      reviewCount: avgAgg[0] ? avgAgg[0].count : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/public/owner/check-phone  (returns whether a business + PIN exists for the phone) ── */
router.post('/owner/check-phone', async (req, res) => {
  try {
    const digits = String(req.body.ownerPhone || '').replace(/\D/g, '');
    if (!digits) return res.status(400).json({ error: 'ownerPhone required' });
    const biz = await Business.findOne({ ownerPhone: digits }).select('_id name ownerPin').lean();
    if (!biz) return res.json({ found: false });
    res.json({ found: true, hasPin: !!biz.ownerPin, name: biz.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── PUT /api/public/owner/update/:id  (owner edits their business, PIN required) ── */
const _ownerUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
  .fields([
    { name: 'image',          maxCount: 1 },
    { name: 'coverImageFile', maxCount: 1 },
    { name: 'galleryFiles',   maxCount: 20 },
    ...[1,2,3,4,5,6].map(n => ({ name: `service${n}Image`, maxCount: 1 })),
  ]);

router.put('/owner/update/:id', _ownerUpload, async (req, res) => {
  try {
    const { pin, ownerPhone } = req.body;
    const digits = String(ownerPhone || '').replace(/\D/g, '');
    if (!digits || !/^\d{4}$/.test(String(pin || ''))) {
      return res.status(400).json({ error: 'ownerPhone and PIN are required.' });
    }
    const biz = await Business.findById(req.params.id);
    if (!biz) return res.status(404).json({ error: 'Not found' });
    if (String(biz.ownerPhone).replace(/\D/g, '') !== digits) {
      return res.status(403).json({ error: 'Phone mismatch' });
    }
    if (!biz.ownerPin) return res.status(403).json({ error: 'no_pin_set' });
    const ok = await bcrypt.compare(String(pin), biz.ownerPin);
    if (!ok) return res.status(403).json({ error: 'wrong_pin' });

    /* Apply text fields */
    const TEXT_FIELDS = [
      'name','description','category','subCategory',
      'address','landmark','serviceLocations','city','pincode',
      'phone','whatsappNo','landline','phone2','email','website',
      'fbLink','twitterLink','instaLink','googleMap','videoUrl',
      'openTime','closeTime','lat','lng','infoQuestion','infoAnswer',
    ];
    for (const f of TEXT_FIELDS) {
      if (req.body[f] !== undefined) biz[f] = String(req.body[f]);
    }
    if (req.body.openDays !== undefined) {
      const raw = req.body.openDays;
      biz.openDays = Array.isArray(raw) ? raw.join(',') : String(raw || '');
    }

    /* Handle PIN change */
    const newPin = String(req.body.newPin || '').replace(/\D/g,'');
    if (newPin && /^\d{4}$/.test(newPin)) {
      biz.ownerPin = await bcrypt.hash(newPin, 10);
    }

    /* Profile image */
    if (req.body.croppedImage && req.body.croppedImage.startsWith('data:image')) {
      if (biz.imagePublicId) await destroy(biz.imagePublicId).catch(() => {});
      const base64Data = req.body.croppedImage.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const r = await memberUpload(buffer, { phone: biz.ownerPhone, subfolder: 'business' });
      biz.image = r.secure_url; biz.imagePublicId = r.public_id;
    } else if (req.files?.image?.[0]) {
      if (biz.imagePublicId) await destroy(biz.imagePublicId).catch(() => {});
      const r = await memberUpload(req.files.image[0].buffer, { phone: biz.ownerPhone, subfolder: 'business' });
      biz.image = r.secure_url; biz.imagePublicId = r.public_id;
    }

    /* Cover image */
    if (req.files?.coverImageFile?.[0]) {
      if (biz.coverImagePublicId) await destroy(biz.coverImagePublicId).catch(() => {});
      const r = await memberUpload(req.files.coverImageFile[0].buffer, { phone: biz.ownerPhone, subfolder: 'business/cover' });
      biz.coverImage = r.secure_url; biz.coverImagePublicId = r.public_id;
    }

    /* Gallery - remove old */
    const toRemove = (req.body.galleryToRemove || '').split(',').filter(Boolean);
    for (const pid of toRemove) await destroy(pid).catch(() => {});
    if (toRemove.length) {
      biz.galleryImages = (biz.galleryImages || []).filter(g => !toRemove.includes(g.publicId));
    }
    /* Gallery - add new */
    const newGallery = req.files?.galleryFiles || [];
    for (const gf of newGallery) {
      const r = await memberUpload(gf.buffer, { phone: biz.ownerPhone, subfolder: 'business/gallery' });
      biz.galleryImages = biz.galleryImages || [];
      biz.galleryImages.push({ url: r.secure_url, publicId: r.public_id });
    }

    /* Services */
    const existing = Array.isArray(biz.services) ? [...biz.services] : [];
    while (existing.length < 6) existing.push({ name:'', price:'', detail:'', image:'', imagePublicId:'' });
    for (let i = 1; i <= 6; i++) {
      const s = { ...existing[i-1] };
      if (req.body[`service${i}Name`]   !== undefined) s.name   = req.body[`service${i}Name`];
      if (req.body[`service${i}Price`]  !== undefined) s.price  = req.body[`service${i}Price`];
      if (req.body[`service${i}Detail`] !== undefined) s.detail = req.body[`service${i}Detail`];
      const sf = req.files?.[`service${i}Image`]?.[0];
      if (sf) {
        if (s.imagePublicId) await destroy(s.imagePublicId).catch(() => {});
        const r = await memberUpload(sf.buffer, { phone: biz.ownerPhone, subfolder: 'business/services' });
        s.image = r.secure_url; s.imagePublicId = r.public_id;
      }
      existing[i-1] = s;
    }
    biz.services = existing.filter(s => s.name || s.image);

    await biz.save();

    /* Return safe version */
    const saved = biz.toObject();
    const { ownerPin: _pin2, ownerPhone: _ph2, ...safeDoc } = saved;
    res.json({ item: safeDoc });
  } catch (err) {
    console.error('[owner.update]', err);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/public/members — public member list (logged-in users only via frontend check) ── */
router.get('/members', async (req, res) => {
  try {
    const { page = 1, q = '', district = '' } = req.query;
    const { getMemberModel } = require('../services/memberDb');
    const VaniganMember = await getMemberModel();
    const filter = { active: true, isOrganizer: { $ne: true } };
    if (district) filter.district = district;
    if (q) {
      const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { assemblyName: rx }, { district: rx }];
    }
    const skip = (Math.max(1, parseInt(page)) - 1) * 50;
    const [members, total] = await Promise.all([
      VaniganMember.find(filter)
        .select('name phone photoUrl membershipId district assemblyName bizCategory hasEpic businessId createdAt')
        .sort({ createdAt: -1 })
        .skip(skip).limit(50).lean(),
      VaniganMember.countDocuments(filter),
    ]);
    // Enrich with business
    const phones = members.map(m => m.phone).filter(Boolean);
    const bizDocs = phones.length
      ? await Business.find({ ownerPhone: { $in: phones }, active: true }).select('_id name ownerPhone category image').lean()
      : [];
    const bizByPhone = {};
    bizDocs.forEach(b => { bizByPhone[b.ownerPhone] = b; });
    const enriched = members.map(m => ({ ...m, business: bizByPhone[m.phone] || null }));
    res.json({ members: enriched, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/public/organizers — public organizer list ── */
router.get('/organizers', async (req, res) => {
  try {
    const { page = 1, q = '', district = '' } = req.query;
    const { getOrganizerModel } = require('../services/memberDb');
    const Organizer = await getOrganizerModel();
    const filter = { active: true };
    if (district) filter.district = district;
    if (q) {
      const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { role: rx }, { district: rx }];
    }
    const skip = (Math.max(1, parseInt(page)) - 1) * 50;
    const [organizers, total] = await Promise.all([
      Organizer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(50).lean(),
      Organizer.countDocuments(filter),
    ]);
    // Enrich with business
    const phones = organizers.map(o => o.phone).filter(Boolean);
    const bizDocs = phones.length
      ? await Business.find({ ownerPhone: { $in: phones }, active: true }).select('_id name ownerPhone category image').lean()
      : [];
    const bizByPhone = {};
    bizDocs.forEach(b => { bizByPhone[b.ownerPhone] = b; });
    const enriched = organizers.map(o => ({ ...o, business: bizByPhone[o.phone] || null }));
    res.json({ organizers: enriched, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
