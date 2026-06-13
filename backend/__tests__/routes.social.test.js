/**
 * routes/social.js  —  follow / save / profile endpoints
 */
const request  = require('supertest');
const express  = require('express');
const mongoose = require('mongoose');

const fakeMemberDoc = {
  phone: '9876543210',
  following:       [],
  savedBusinesses: [],
  businessId: null,
  save: jest.fn().mockResolvedValue(true),
  toObject: jest.fn().mockReturnValue({
    phone: '9876543210', following: [], savedBusinesses: [], businessId: null,
  }),
};

const fakeUserDoc = {
  phone: '1112223333',
  following:       [],
  savedBusinesses: [],
  businessId: null,
  save: jest.fn().mockResolvedValue(true),
  toObject: jest.fn().mockReturnValue({
    phone: '1112223333', following: [], savedBusinesses: [], businessId: null,
  }),
};

const mockVaniganMember = { findOne: jest.fn(), find: jest.fn() };
const mockVaniganUser   = { findOne: jest.fn(), find: jest.fn() };

jest.mock('../models/Business', () => ({
  findOne: jest.fn(),
  find:    jest.fn().mockResolvedValue([]),
}));
jest.mock('../services/memberDb', () => ({
  getMemberModel:       jest.fn().mockResolvedValue(mockVaniganMember),
  getVaniganUserModel:  jest.fn().mockResolvedValue(mockVaniganUser),
}));

const Business = require('../models/Business');

let app;
beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/social', require('../routes/social'));
});
afterEach(() => {
  jest.clearAllMocks();
  fakeMemberDoc.following       = [];
  fakeMemberDoc.savedBusinesses = [];
  fakeMemberDoc.save.mockClear();
});

// ── POST /follow ──────────────────────────────────────────────────────────────
describe('POST /api/social/follow', () => {
  const bizId = new mongoose.Types.ObjectId().toString();

  test('400 when phone or businessId missing', async () => {
    const res = await request(app).post('/api/social/follow').send({ phone: '9876543210' });
    expect(res.status).toBe(400);
  });

  test('404 when no user found', async () => {
    mockVaniganMember.findOne.mockResolvedValue(null);
    mockVaniganUser.findOne.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/social/follow')
      .send({ phone: '0000000000', businessId: bizId });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('no_account');
  });

  test('follows a business (toggle on)', async () => {
    mockVaniganMember.findOne.mockResolvedValue({ ...fakeMemberDoc });
    const res = await request(app)
      .post('/api/social/follow')
      .send({ phone: '9876543210', businessId: bizId });
    expect(res.status).toBe(200);
    expect(res.body.followed).toBe(true);
    expect(res.body.followingCount).toBe(1);
  });

  test('unfollows when already followed (toggle off)', async () => {
    const oid = new mongoose.Types.ObjectId(bizId);
    const doc = { ...fakeMemberDoc, following: [oid], save: jest.fn().mockResolvedValue(true) };
    mockVaniganMember.findOne.mockResolvedValue(doc);

    const res = await request(app)
      .post('/api/social/follow')
      .send({ phone: '9876543210', businessId: bizId });
    expect(res.status).toBe(200);
    expect(res.body.followed).toBe(false);
    expect(res.body.followingCount).toBe(0);
  });
});

// ── POST /save ────────────────────────────────────────────────────────────────
describe('POST /api/social/save', () => {
  const bizId = new mongoose.Types.ObjectId().toString();

  test('400 when phone or businessId missing', async () => {
    const res = await request(app).post('/api/social/save').send({ businessId: bizId });
    expect(res.status).toBe(400);
  });

  test('saves a business', async () => {
    mockVaniganMember.findOne.mockResolvedValue({ ...fakeMemberDoc });
    const res = await request(app)
      .post('/api/social/save')
      .send({ phone: '9876543210', businessId: bizId });
    expect(res.status).toBe(200);
    expect(res.body.saved).toBe(true);
  });

  test('unsaves when already saved', async () => {
    const oid = new mongoose.Types.ObjectId(bizId);
    const doc = { ...fakeMemberDoc, savedBusinesses: [oid], save: jest.fn().mockResolvedValue(true) };
    mockVaniganMember.findOne.mockResolvedValue(doc);

    const res = await request(app)
      .post('/api/social/save')
      .send({ phone: '9876543210', businessId: bizId });
    expect(res.status).toBe(200);
    expect(res.body.saved).toBe(false);
  });
});

// ── GET /profile ──────────────────────────────────────────────────────────────
describe('GET /api/social/profile', () => {
  test('400 when phone missing', async () => {
    const res = await request(app).get('/api/social/profile');
    expect(res.status).toBe(400);
  });

  test('404 when no account found', async () => {
    mockVaniganMember.findOne.mockResolvedValue(null);
    mockVaniganUser.findOne.mockResolvedValue(null);
    const res = await request(app).get('/api/social/profile?phone=0000000000');
    expect(res.status).toBe(404);
  });

  test('200 returns profile with counts', async () => {
    mockVaniganMember.findOne.mockResolvedValue(fakeMemberDoc);
    mockVaniganMember.find.mockResolvedValue([]);
    mockVaniganUser.find.mockResolvedValue([]);
    Business.find.mockResolvedValue([]);

    const res = await request(app).get('/api/social/profile?phone=9876543210');
    expect(res.status).toBe(200);
    expect(res.body.profile.followingCount).toBe(0);
    expect(res.body.profile.savedCount).toBe(0);
  });
});

// ── GET /biz-by-phone ──────────────────────────────────────────────────────────
describe('GET /api/social/biz-by-phone', () => {
  test('400 when phone missing', async () => {
    const res = await request(app).get('/api/social/biz-by-phone');
    expect(res.status).toBe(400);
  });

  test('returns found: false when no business', async () => {
    Business.findOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });
    const res = await request(app).get('/api/social/biz-by-phone?phone=9876543210');
    expect(res.status).toBe(200);
    expect(res.body.found).toBe(false);
  });

  test('returns business when found', async () => {
    const biz = { _id: 'b1', name: 'Biz', category: 'Food' };
    Business.findOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(biz) }) });
    const res = await request(app).get('/api/social/biz-by-phone?phone=9876543210');
    expect(res.status).toBe(200);
    expect(res.body.found).toBe(true);
    expect(res.body.biz.name).toBe('Biz');
  });
});
