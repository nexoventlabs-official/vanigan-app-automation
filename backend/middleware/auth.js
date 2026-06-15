const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  // FIX H2: Hard-fail if JWT_SECRET is not configured — never fall back to dev-secret
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[auth] CRITICAL: JWT_SECRET env var is not set. All authenticated requests will be rejected.');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, secret);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
