/**
 * routes/plans.js  —  CRUD plan admin API
 */
const request = require('supertest');
const express = require('express');
const jwt     = require('jsonwebtoken');

// ── Mocks ─────────────────────────────────────────────────────────────────────
jest.mock('../models/Plan', () => ({
  find:             jest.fn(),
  findById:         jest.fn(),
  findOneAndUpdate: jest.fn(),
}));
jest.mock('../services/cloudinary', () => ({
  uploadBuffer: jest.fn().mockResolvedValue({ secure_url: 'https://cdn/plan.jpg', public_id: 'plan/abc' }),
  destroy:      jest.fn().mockResolvedValue({}),
  ROOT:         'vanigan',
}));
// auth middleware — real jwt verify
const Plan = require('../models/Plan');

function authHeader() {
  return `Bearer ${jwt.sign({ id: '1', username: 'admin', role: 'superadmin' }, process.env.JWT_SECRET, { expiresIn: '1h' })}`;
}

let app;
beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/plans', require('../routes/plans'));
});
afterEach(() => jest.clearAllMocks());

// ── GET / ─────────────────────────────────────────────────────────────────────
describe('GET /api/plans', () => {
  test('returns plans list', async () => {
    Plan.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{ code: 'free', name: 'Free' }]) }),
    });
    const res = await request(app).get('/api/plans').set('Authorization', authHeader());
    expect(res.status).toBe(200);
    expect(res.body.plans).toHaveLength(1);
  });

  test('401 without auth', async () => {
    const res = await request(app).get('/api/plans');
    expect(res.status).toBe(401);
  });
});

// ── POST / ───────────────────────────────────────────────────────────────────
describe('POST /api/plans', () => {
  test('400 for invalid code', async () => {
    const res = await request(app)
      .post('/api/plans')
      .set('Authorization', authHeader())
      .send({ code: 'gold', name: 'Gold' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/code must be/i);
  });

  test('400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/plans')
      .set('Authorization', authHeader())
      .send({ code: 'free' });
    expect(res.status).toBe(400);
  });

  test('200 upserts plan on valid input', async () => {
    const planDoc = { _id: 'p1', code: 'free', name: 'Free', features: [] };
    Plan.findOneAndUpdate.mockResolvedValue(planDoc);

    const res = await request(app)
      .post('/api/plans')
      .set('Authorization', authHeader())
      .send({ code: 'free', name: 'Free', features: 'Browse listings\nContact businesses' });

    expect(res.status).toBe(200);
    expect(res.body.plan).toMatchObject({ code: 'free', name: 'Free' });
    expect(Plan.findOneAndUpdate).toHaveBeenCalledWith(
      { code: 'free' },
      expect.objectContaining({ $set: expect.objectContaining({ name: 'Free' }) }),
      { upsert: true, new: true }
    );
  });
});

// ── PUT /:id ──────────────────────────────────────────────────────────────────
describe('PUT /api/plans/:id', () => {
  test('404 when plan not found', async () => {
    Plan.findById.mockResolvedValue(null);
    const res = await request(app)
      .put('/api/plans/nonexistent')
      .set('Authorization', authHeader())
      .send({ name: 'Updated' });
    expect(res.status).toBe(404);
  });

  test('200 updates plan fields', async () => {
    const plan = { _id: 'p1', code: 'premium', name: 'Premium', active: true, save: jest.fn() };
    Plan.findById.mockResolvedValue(plan);

    const res = await request(app)
      .put('/api/plans/p1')
      .set('Authorization', authHeader())
      .send({ name: 'Premium Plus+', active: 'false' });

    expect(res.status).toBe(200);
    expect(plan.name).toBe('Premium Plus+');
    expect(plan.active).toBe(false);
    expect(plan.save).toHaveBeenCalled();
  });
});

// ── DELETE /:id ───────────────────────────────────────────────────────────────
describe('DELETE /api/plans/:id', () => {
  test('200 ok when plan not found (idempotent)', async () => {
    Plan.findById.mockResolvedValue(null);
    const res = await request(app)
      .delete('/api/plans/absent')
      .set('Authorization', authHeader());
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('200 deletes plan', async () => {
    const cloudinary = require('../services/cloudinary');
    const plan = { _id: 'p1', imagePublicId: 'img/123', deleteOne: jest.fn() };
    Plan.findById.mockResolvedValue(plan);

    const res = await request(app)
      .delete('/api/plans/p1')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(cloudinary.destroy).toHaveBeenCalledWith('img/123');
    expect(plan.deleteOne).toHaveBeenCalled();
  });
});
