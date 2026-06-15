const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const Admin = require('../models/Admin');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// FIX H1: Rate-limit admin login — max 10 attempts per 15 min per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username & password required' });

    const admin = await Admin.findOne({ username: username.trim() });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // FIX H2: Use JWT_SECRET from env — never fall back to hardcoded string
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[auth] JWT_SECRET is not set');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    // FIX M7: Reduced token expiry from 7d to 24h
    const token = jwt.sign(
      { id: admin._id.toString(), username: admin.username, role: admin.role },
      secret,
      { expiresIn: '24h' }
    );
    res.json({
      token,
      user: { id: admin._id, username: admin.username, role: admin.role },
    });
  } catch (err) {
    console.error('[auth] login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/verify', authMiddleware, async (req, res) => {
  const admin = await Admin.findById(req.user.id).lean();
  if (!admin) return res.status(401).json({ error: 'Invalid' });
  res.json({ user: { id: admin._id, username: admin.username, role: admin.role } });
});

module.exports = router;
