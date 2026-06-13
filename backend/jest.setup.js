/**
 * Global test setup — stubs every external dependency so tests run
 * without any live database, Cloudinary, or Meta API connection.
 */

// ── Environment ──────────────────────────────────────────────────────────────
process.env.JWT_SECRET        = 'test-secret';
process.env.NODE_ENV          = 'test';
// Suppress Mongoose connection attempts by leaving DB URIs empty
// (models that branch on MEMBER_MONGODB_URI / BUSINESS_MONGODB_URI will hit
//  the else branch and register on the default Mongoose connection, which we
//  never open → tests use jest.mock() on each model individually)

// ── Global Jest config ────────────────────────────────────────────────────────
jest.setTimeout(15000);
