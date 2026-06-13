/**
 * routes/auth.js  —  admin login & verify
 */
const request = require('supertest');
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');

jest.mock('../models/Admin', () => ({
  findOne:  jest.fn(),
  findById: jest.fn(),
}));
const Admin = require('../models/Admin');

let app;
let adminPasswordHash;
beforeAll(async () => {
  adminPasswordHash = await bcrypt.hash('secret', 10);
  app = express();
  app.use(express.json());
  app.use('/api/auth', require('../routes/auth'));
});

afterEach(() => jest.clearAllMocks());

// ── POST /login ───────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  test('400 when username or password missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'admin' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('401 when admin not found', async () => {
    Admin.findOne.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'any' });
    expect(res.status).toBe(401);
  });

  test('401 when password is wrong', async () => {
    Admin.findOne.mockResolvedValue({
      _id: 'adminId1', username: 'admin', passwordHash: adminPasswordHash, role: 'superadmin',
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrongpass' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  test('200 with token on correct credentials', async () => {
    Admin.findOne.mockResolvedValue({
      _id: 'adminId1', username: 'admin', passwordHash: adminPasswordHash, role: 'superadmin',
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'secret' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe('admin');
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET || 'dev-secret');
    expect(decoded.username).toBe('admin');
  });
});

// ── GET /verify ───────────────────────────────────────────────────────────────
describe('GET /api/auth/verify', () => {
  test('401 without token', async () => {
    const res = await request(app).get('/api/auth/verify');
    expect(res.status).toBe(401);
  });

  test('401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', 'Bearer bad.token');
    expect(res.status).toBe(401);
  });

  test('200 with valid token and existing admin', async () => {
    const token = jwt.sign(
      { id: 'adminId1', username: 'admin', role: 'superadmin' },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '1h' }
    );
    // findById returns object with .lean() chain
    Admin.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'adminId1', username: 'admin', role: 'superadmin' }),
    });
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('admin');
  });

  test('401 when admin no longer exists in DB', async () => {
    const token = jwt.sign(
      { id: 'adminId1', username: 'admin', role: 'superadmin' },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '1h' }
    );
    Admin.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});
