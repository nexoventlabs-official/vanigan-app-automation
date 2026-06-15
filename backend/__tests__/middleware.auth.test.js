/**
 * middleware/auth.js  —  unit tests
 *
 * FIX H2: JWT_SECRET is now required — no dev-secret fallback.
 * The middleware returns 500 when JWT_SECRET is missing in production,
 * but tests always have JWT_SECRET set via jest.setup.js.
 */
const jwt = require('jsonwebtoken');

// Load the middleware fresh for each test
function makeMiddleware() {
  jest.resetModules();
  return require('../middleware/auth');
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

describe('authMiddleware', () => {
  const SECRET = 'test-secret'; // matches jest.setup.js JWT_SECRET
  const payload = { id: 'user1', username: 'admin', role: 'superadmin' };

  beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
  });

  test('calls next() with valid Bearer token', () => {
    const token = jwt.sign(payload, SECRET);
    const req  = { headers: { authorization: `Bearer ${token}` } };
    const res  = mockRes();
    const next = jest.fn();

    makeMiddleware()(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ id: 'user1', username: 'admin' });
  });

  test('returns 401 when no Authorization header', () => {
    const req  = { headers: {} };
    const res  = mockRes();
    const next = jest.fn();

    makeMiddleware()(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when Authorization header missing Bearer prefix', () => {
    const token = jwt.sign(payload, SECRET);
    const req  = { headers: { authorization: token } }; // no "Bearer "
    const res  = mockRes();
    const next = jest.fn();

    makeMiddleware()(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 for tampered / invalid token', () => {
    const req  = { headers: { authorization: 'Bearer invalid.token.here' } };
    const res  = mockRes();
    const next = jest.fn();

    makeMiddleware()(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 for expired token', () => {
    const token = jwt.sign(payload, SECRET, { expiresIn: -1 }); // already expired
    const req  = { headers: { authorization: `Bearer ${token}` } };
    const res  = mockRes();
    const next = jest.fn();

    makeMiddleware()(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 500 when JWT_SECRET is not set (FIX H2 — no dev-secret fallback)', () => {
    delete process.env.JWT_SECRET;
    // Token signed with any secret — should be rejected when secret is missing
    const token = jwt.sign(payload, 'some-old-secret');
    const req  = { headers: { authorization: `Bearer ${token}` } };
    const res  = mockRes();
    const next = jest.fn();

    makeMiddleware()(req, res, next);

    // Must return 500 Server Misconfiguration — not 401, not calling next()
    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();

    // Restore for subsequent tests
    process.env.JWT_SECRET = SECRET;
  });
});
