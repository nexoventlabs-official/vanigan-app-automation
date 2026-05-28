const express  = require('express');
const mongoose = require('mongoose');
const Business = require('../models/Business');
const Review   = require('../models/Review');

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

module.exports = router;
