/**
 * routes/webAuth.js  —  website user signup / login / me / link-business
 */
const request = require('supertest');
const express = require('express');
const bcrypt  = require('bcryptjs');

// Mock rate limiter to skip IP-based throttling in tests
jest.mock('express-rate-limit', () => () => (_req, _res, next) => next());

jest.mock('../models/VaniganUser', () => ({
  findOne:           jest.fn(),
  create:            jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));
jest.mock('../models/Business', () => ({
  findOne:           jest.fn().mockResolvedValue(null),
  findByIdAndUpdate: jest.fn(),
  findById:          jest.fn(),
}));
jest.mock('../models/Review', () => ({
  find:      jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }),
  aggregate: jest.fn().mockResolvedValue([]),
}));

const VaniganUser = require('../models/VaniganUser');
const Business    = require('../models/Business');

let app;
beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/web-auth', require('../routes/webAuth'));
});
afterEach(() => jest.clearAllMocks());

// ── /signup ───────────────────────────────────────────────────────────────────
describe('POST /api/web-auth/signup', () => {
  test('400 when phone is too short', async () => {
    const res = await request(app)
      .post('/api/web-auth/signup')
      .send({ phone: '12345', pin: '1234', confirmPin: '1234', name: 'Alice' });
    expect(res.status).toBe(400);
  });

  test('400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/web-auth/signup')
      .send({ phone: '9876543210', pin: '1234', confirmPin: '1234' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/i);
  });

  test('400 when PIN is not 4 digits', async () => {
    const res = await request(app)
      .post('/api/web-auth/signup')
      .send({ phone: '9876543210', pin: '123', confirmPin: '123', name: 'Alice' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/4 digits/i);
  });

  test('400 when PINs do not match', async () => {
    const res = await request(app)
      .post('/api/web-auth/signup')
      .send({ phone: '9876543210', pin: '1234', confirmPin: '9999', name: 'Alice' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/match/i);
  });

  test('409 when phone already registered', async () => {
    VaniganUser.findOne.mockResolvedValue({ _id: 'u1' });
    const res = await request(app)
      .post('/api/web-auth/signup')
      .send({ phone: '9876543210', pin: '1234', confirmPin: '1234', name: 'Alice' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('phone_exists');
  });

  test('200 creates user and returns safe user object (no pinHash)', async () => {
    VaniganUser.findOne.mockResolvedValue(null); // no existing user
    Business.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const fakeUser = {
      _id: 'u1', phone: '9876543210', name: 'Alice',
      pinHash: 'shouldnotappear',
      toObject: () => ({ _id: 'u1', phone: '9876543210', name: 'Alice', pinHash: 'shouldnotappear' }),
    };
    VaniganUser.create.mockResolvedValue(fakeUser);

    const res = await request(app)
      .post('/api/web-auth/signup')
      .send({ phone: '9876543210', pin: '1234', confirmPin: '1234', name: 'Alice' });

    expect(res.status).toBe(200);
    expect(res.body.user.pinHash).toBeUndefined();
    expect(res.body.user.name).toBe('Alice');
  });
});

// ── /login ────────────────────────────────────────────────────────────────────
describe('POST /api/web-auth/login', () => {
  test('400 when phone or pin missing', async () => {
    const res = await request(app)
      .post('/api/web-auth/login')
      .send({ phone: '9876543210' });
    expect(res.status).toBe(400);
  });

  test('404 when no account exists', async () => {
    VaniganUser.findOne.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/web-auth/login')
      .send({ phone: '9876543210', pin: '1234' });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('no_account');
  });

  test('403 when PIN is wrong', async () => {
    const wrongHash = await bcrypt.hash('9999', 10);
    VaniganUser.findOne.mockResolvedValue({
      phone: '9876543210', pinHash: wrongHash, businessId: null, save: jest.fn(),
      toObject: () => ({ phone: '9876543210', pinHash: wrongHash }),
    });
    Business.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const res = await request(app)
      .post('/api/web-auth/login')
      .send({ phone: '9876543210', pin: '1234' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('wrong_pin');
  });

  test('200 on correct credentials, pinHash stripped', async () => {
    const hash = await bcrypt.hash('1234', 10);
    VaniganUser.findOne.mockResolvedValue({
      phone: '9876543210', pinHash: hash, businessId: null, save: jest.fn(),
      toObject: () => ({ phone: '9876543210', name: 'Alice', pinHash: hash }),
    });
    Business.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const res = await request(app)
      .post('/api/web-auth/login')
      .send({ phone: '9876543210', pin: '1234' });

    expect(res.status).toBe(200);
    expect(res.body.user.pinHash).toBeUndefined();
    expect(res.body.user.name).toBe('Alice');
  });
});

// ── /check-phone ──────────────────────────────────────────────────────────────
describe('GET /api/web-auth/check-phone', () => {
  test('400 when phone missing', async () => {
    const res = await request(app).get('/api/web-auth/check-phone');
    expect(res.status).toBe(400);
  });

  test('returns exists: false for unknown phone', async () => {
    VaniganUser.findOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });
    const res = await request(app).get('/api/web-auth/check-phone?phone=9876543210');
    expect(res.status).toBe(200);
    expect(res.body.exists).toBe(false);
  });

  test('returns exists: true for known phone', async () => {
    VaniganUser.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'u1', name: 'Alice', phone: '9876543210' }),
      }),
    });
    const res = await request(app).get('/api/web-auth/check-phone?phone=9876543210');
    expect(res.status).toBe(200);
    expect(res.body.exists).toBe(true);
    expect(res.body.name).toBe('Alice');
  });
});

// ── /me ───────────────────────────────────────────────────────────────────────
describe('GET /api/web-auth/me', () => {
  test('400 when phone missing', async () => {
    const res = await request(app).get('/api/web-auth/me');
    expect(res.status).toBe(400);
  });

  test('404 when user not found', async () => {
    VaniganUser.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const res = await request(app).get('/api/web-auth/me?phone=9876543210');
    expect(res.status).toBe(404);
  });

  test('200 returns safe user', async () => {
    VaniganUser.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'u1', phone: '9876543210', name: 'Alice', pinHash: 'x' }),
    });
    Business.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const res = await request(app).get('/api/web-auth/me?phone=9876543210');
    expect(res.status).toBe(200);
    expect(res.body.user.pinHash).toBeUndefined();
    expect(res.body.user.name).toBe('Alice');
  });
});
