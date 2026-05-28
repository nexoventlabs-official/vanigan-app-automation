const express = require('express');
const Business = require('../models/Business');

const router = express.Router();
const PAGE_LIMIT = 60;

/* ── GET /api/public/businesses ── */
router.get('/businesses', async (req, res) => {
  try {
    const { category, subcategory, district, assembly, search, ownerPhone, page = 1 } = req.query;
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
    const skip = (parseInt(page, 10) - 1) * PAGE_LIMIT;
    const [businesses, total] = await Promise.all([
      Business.find(filter)
        .select('-ownerPhone')
        .sort({ name: 1 })
        .skip(skip)
        .limit(PAGE_LIMIT)
        .lean(),
      Business.countDocuments(filter),
    ]);
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
    res.json(biz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
