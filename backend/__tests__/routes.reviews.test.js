/**
 * routes/reviews.js  —  admin review list & delete
 * Note: jest.mock() factory can only reference variables prefixed with "mock"
 */
const request = require('supertest');
const express = require('express');
const jwt     = require('jsonwebtoken');

// Prefix variables referenced inside jest.mock() factories with "mock"
const mockOrganizerModel = { find: jest.fn().mockResolvedValue([]) };
const mockMemberModel    = { find: jest.fn().mockResolvedValue([]) };

jest.mock('../models/Review', () => ({
  find:              jest.fn(),
  findByIdAndDelete: jest.fn(),
}));
jest.mock('../models/Business', () => ({
  find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
}));
jest.mock('../services/memberDb', () => ({
  getOrganizerModel:    jest.fn().mockResolvedValue(mockOrganizerModel),
  getMemberListingModel: jest.fn().mockResolvedValue(mockMemberModel),
}));

const Review = require('../models/Review');

function authHeader() {
  return `Bearer ${jwt.sign({ id: '1', username: 'admin', role: 'superadmin' }, process.env.JWT_SECRET, { expiresIn: '1h' })}`;
}

let app;
beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/reviews', require('../routes/reviews'));
});
afterEach(() => jest.clearAllMocks());

describe('GET /api/reviews', () => {
  test('401 without auth', async () => {
    const res = await request(app).get('/api/reviews');
    expect(res.status).toBe(401);
  });

  test('returns hydrated review list', async () => {
    const revDocs = [
      { _id: 'r1', targetKind: 'business', targetId: 'biz1', rating: 5, text: 'Great' },
    ];
    Review.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(revDocs) }),
      }),
    });
    const Business = require('../models/Business');
    // Business.find is called with { _id: { $in: [...] } } and { name: 1 }, returns .lean()
    Business.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([{ _id: 'biz1', name: 'Test Biz' }]) });

    const res = await request(app).get('/api/reviews').set('Authorization', authHeader());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.reviews)).toBe(true);
  });

  test('filters by kind param', async () => {
    Review.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      }),
    });
    await request(app).get('/api/reviews?kind=business').set('Authorization', authHeader());
    const filterArg = Review.find.mock.calls[0][0];
    expect(filterArg.targetKind).toBe('business');
  });
});

describe('DELETE /api/reviews/:id', () => {
  test('deletes review by id', async () => {
    Review.findByIdAndDelete.mockResolvedValue({});
    const res = await request(app)
      .delete('/api/reviews/r1')
      .set('Authorization', authHeader());
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Review.findByIdAndDelete).toHaveBeenCalledWith('r1');
  });
});
