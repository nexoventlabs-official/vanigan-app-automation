/**
 * routes/users.js  —  admin user management
 */
const request = require('supertest');
const express = require('express');
const jwt     = require('jsonwebtoken');

jest.mock('../models/User', () => ({
  find:            jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));
jest.mock('../models/InboundMessage', () => ({
  find: jest.fn(),
}));

const User           = require('../models/User');
const InboundMessage = require('../models/InboundMessage');

function authHeader() {
  return `Bearer ${jwt.sign({ id: '1', username: 'admin', role: 'superadmin' }, process.env.JWT_SECRET, { expiresIn: '1h' })}`;
}

let app;
beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/users', require('../routes/users'));
});
afterEach(() => jest.clearAllMocks());

describe('GET /api/users', () => {
  test('returns users list', async () => {
    User.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{ phone: '9999999999', name: 'Alice' }]) }),
    });
    const res = await request(app).get('/api/users').set('Authorization', authHeader());
    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
  });

  test('401 without token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  test('passes search query to filter', async () => {
    User.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
    });
    await request(app).get('/api/users?q=alice').set('Authorization', authHeader());
    const filterArg = User.find.mock.calls[0][0];
    expect(filterArg.$or).toBeDefined();
  });
});

describe('GET /api/users/contacts', () => {
  test('returns inbound messages', async () => {
    InboundMessage.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{ phone: '1234567890' }]) }),
      }),
    });
    const res = await request(app).get('/api/users/contacts').set('Authorization', authHeader());
    expect(res.status).toBe(200);
    expect(res.body.contacts).toHaveLength(1);
  });
});

describe('PATCH /api/users/:id', () => {
  test('updates user name and plan', async () => {
    const updatedUser = { _id: '1', name: 'Bob', currentPlan: 'premium' };
    User.findByIdAndUpdate.mockResolvedValue(updatedUser);

    const res = await request(app)
      .patch('/api/users/1')
      .set('Authorization', authHeader())
      .send({ name: 'Bob', currentPlan: 'premium' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Bob');
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      '1',
      { $set: { name: 'Bob', currentPlan: 'premium' } },
      { new: true }
    );
  });

  test('ignores invalid currentPlan value', async () => {
    User.findByIdAndUpdate.mockResolvedValue({ _id: '1', name: 'Bob' });
    await request(app)
      .patch('/api/users/1')
      .set('Authorization', authHeader())
      .send({ currentPlan: 'diamond' });

    const updateArg = User.findByIdAndUpdate.mock.calls[0][1];
    expect(updateArg.$set.currentPlan).toBeUndefined();
  });
});

describe('DELETE /api/users/:id', () => {
  test('deletes user', async () => {
    User.findByIdAndDelete.mockResolvedValue({});
    const res = await request(app)
      .delete('/api/users/1')
      .set('Authorization', authHeader());
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
