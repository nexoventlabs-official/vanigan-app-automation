const express = require('express');
const auth = require('../middleware/auth');
const districts = require('../services/districts');

const router = express.Router();

/** Full district → assemblies map. */
router.get('/', auth, (_req, res) => {
  res.json({ map: districts.getMap() });
});

/** Assemblies for a single district (used in CRUD form cascades). */
router.get('/:district/assemblies', auth, (req, res) => {
  res.json({ assemblies: districts.getAssemblies(req.params.district) });
});

module.exports = router;
