/**
 * routes/dashboard.js  —  admin stats endpoint
 * Note: jest.mock() factory references must be prefixed with "mock"
 */
const request = require('supertest');
const express = require('express');
const jwt     = require('jsonwebtoken');

// Variables referenced inside jest.mock() MUST be prefixed "mock"
const mockOrganizerModel = { countDocuments: jest.fn().mockResolvedValue(3) };
const mockMemberModel    = { countDocuments: jest.fn().mockResolvedValue(7) };

jest.mock('../models/Business',       () => ({ countDocuments: jest.fn().mockResolvedValue(10) }));
jest.mock('../models/Plan',           () => ({ countDocuments: jest.fn().mockResolvedValue(3) }));
jest.mock('../models/Review', () => ({
  countDocuments: jest.fn().mockResolvedValue(50),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
    }),
  }),
}));
jest.mock('../models/User', () => ({
  countDocuments: jest.fn().mockResolvedValue(200),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
    }),
  }),
}));
jest.mock('../models/InboundMessage', () => ({ countDocuments: jest.fn().mockResolvedValue(500) }));
jest.mock('../services/memberDb', () => ({
  getOrganizerModel:    jest.fn().mockResolvedValue(mockOrganizerModel),
  getMemberListingModel: jest.fn().mockResolvedValue(mockMemberModel),
}));

function authHeader() {
  return `Bearer ${jwt.sign({ id: '1', username: 'admin', role: 'superadmin' }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '1h' })}`;
}

let app;
beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/dashboard', require('../routes/dashboard'));
});

describe('GET /api/dashboard/stats', () => {
  test('401 without auth', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.status).toBe(401);
  });

  test('200 returns all stat counts', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body.stats).toMatchObject({
      businesses: 10,
      organizers: 3,
      members:    7,
      plans:      3,
      reviews:    50,
      users:      200,
      contacts:   500,
    });
    expect(Array.isArray(res.body.recentReviews)).toBe(true);
    expect(Array.isArray(res.body.recentUsers)).toBe(true);
  });
});
