/**
 * routes/_listingFactory.js  —  generic CRUD router
 * Tests the shared listing factory using a mock Model
 */
const request  = require('supertest');
const express  = require('express');
const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');

// ── Shared mock Cloudinary service ────────────────────────────────────────────
const mockCloud = {
  uploadBuffer: jest.fn().mockResolvedValue({ secure_url: 'https://cdn/img.jpg', public_id: 'folder/img' }),
  destroy:      jest.fn().mockResolvedValue({}),
  ROOT:         'vanigan',
};

// ── Factory helpers ───────────────────────────────────────────────────────────
function makeModel(overrides = {}) {
  return {
    find:           jest.fn(),
    findById:       jest.fn(),
    countDocuments: jest.fn().mockResolvedValue(0),
    create:         jest.fn(),
    ...overrides,
  };
}

function makeApp(Model, opts = {}) {
  const listingRouter = require('../routes/_listingFactory');
  const app = express();
  app.use(express.json());
  app.use('/items', listingRouter({ Model, folder: 'items', cloudinaryService: mockCloud, ...opts }));
  return app;
}

function authHeader() {
  return `Bearer ${jwt.sign({ id: '1', username: 'admin', role: 'superadmin' }, process.env.JWT_SECRET, { expiresIn: '1h' })}`;
}

afterEach(() => jest.clearAllMocks());

// ── GET / ─────────────────────────────────────────────────────────────────────
describe('GET /items', () => {
  test('401 without auth', async () => {
    const Model = makeModel();
    const app   = makeApp(Model);
    const res   = await request(app).get('/items');
    expect(res.status).toBe(401);
  });

  test('200 returns paginated items', async () => {
    const Model = makeModel();
    Model.find.mockReturnValue({
      select: jest.fn().mockReturnThis(), // FIX: support .select('-ownerPin -__v')
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      maxTimeMS: jest.fn().mockResolvedValue([{ _id: '1', name: 'Item A' }]),
    });
    Model.countDocuments.mockReturnValue({ maxTimeMS: jest.fn().mockResolvedValue(1) });

    const app = makeApp(Model);
    const res = await request(app).get('/items').set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });

  test('filters by district and assembly', async () => {
    const Model = makeModel();
    Model.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      maxTimeMS: jest.fn().mockResolvedValue([]),
    });
    Model.countDocuments.mockReturnValue({ maxTimeMS: jest.fn().mockResolvedValue(0) });

    const app = makeApp(Model);
    await request(app).get('/items?district=Chennai&assembly=Adyar').set('Authorization', authHeader());

    const filterArg = Model.find.mock.calls[0][0];
    expect(filterArg.district).toBe('Chennai');
    expect(filterArg.assembly).toBe('Adyar');
  });

  test('builds $or filter when search query q is provided', async () => {
    const Model = makeModel();
    Model.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      maxTimeMS: jest.fn().mockResolvedValue([]),
    });
    Model.countDocuments.mockReturnValue({ maxTimeMS: jest.fn().mockResolvedValue(0) });

    const app = makeApp(Model);
    await request(app).get('/items?q=coffee').set('Authorization', authHeader());

    const filterArg = Model.find.mock.calls[0][0];
    expect(filterArg.$or).toBeDefined();
  });
});

// ── GET /:id ──────────────────────────────────────────────────────────────────
describe('GET /items/:id', () => {
  test('404 when item not found', async () => {
    const Model = makeModel({ findById: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });
    const app   = makeApp(Model);
    const res   = await request(app).get('/items/nonexistent').set('Authorization', authHeader());
    expect(res.status).toBe(404);
  });

  test('200 returns item', async () => {
    const item  = { _id: '1', name: 'Item A' };
    const Model = makeModel({ findById: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(item) }) });
    const app   = makeApp(Model);
    const res   = await request(app).get('/items/1').set('Authorization', authHeader());
    expect(res.status).toBe(200);
    expect(res.body.item.name).toBe('Item A');
  });
});

// ── POST / ────────────────────────────────────────────────────────────────────
describe('POST /items', () => {
  test('400 when name is missing', async () => {
    const Model = makeModel();
    const app   = makeApp(Model);
    const res   = await request(app)
      .post('/items')
      .set('Authorization', authHeader())
      .send({ description: 'No name here' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name is required/i);
  });

  test('200 creates item', async () => {
    const created = { _id: 'id1', name: 'New Item', save: jest.fn() };
    const Model   = makeModel({ create: jest.fn().mockResolvedValue(created) });
    const app     = makeApp(Model);
    const res     = await request(app)
      .post('/items')
      .set('Authorization', authHeader())
      .send({ name: 'New Item', district: 'Chennai', assembly: 'Adyar' });

    expect(res.status).toBe(200);
    expect(res.body.item.name).toBe('New Item');
  });
});

// ── PUT /:id ──────────────────────────────────────────────────────────────────
describe('PUT /items/:id', () => {
  test('404 when item not found', async () => {
    const Model = makeModel({ findById: jest.fn().mockResolvedValue(null) });
    const app   = makeApp(Model);
    const res   = await request(app)
      .put('/items/noexist')
      .set('Authorization', authHeader())
      .send({ name: 'Updated' });
    expect(res.status).toBe(404);
  });

  test('200 updates item name', async () => {
    const item  = { _id: 'id1', name: 'Old', description: '', district: '', assembly: '', active: true, save: jest.fn() };
    const Model = makeModel({ findById: jest.fn().mockResolvedValue(item) });
    const app   = makeApp(Model);

    const res = await request(app)
      .put('/items/id1')
      .set('Authorization', authHeader())
      .send({ name: 'Updated Name', active: 'true' });

    expect(res.status).toBe(200);
    expect(item.name).toBe('Updated Name');
    expect(item.save).toHaveBeenCalled();
  });
});

// ── DELETE /:id ───────────────────────────────────────────────────────────────
describe('DELETE /items/:id', () => {
  test('200 ok when item not found (idempotent)', async () => {
    const Model = makeModel({ findById: jest.fn().mockResolvedValue(null) });
    const app   = makeApp(Model);
    const res   = await request(app)
      .delete('/items/absent')
      .set('Authorization', authHeader());
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('200 deletes item and cleans up Cloudinary image', async () => {
    const item = {
      _id:           'id1',
      imagePublicId: 'vanigan/items/img',
      galleryImages: [],
      services:      [],
      deleteOne:     jest.fn().mockResolvedValue({}),
    };
    const Model = makeModel({ findById: jest.fn().mockResolvedValue(item) });
    const app   = makeApp(Model);

    const res = await request(app)
      .delete('/items/id1')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(mockCloud.destroy).toHaveBeenCalledWith('vanigan/items/img');
  });
});
