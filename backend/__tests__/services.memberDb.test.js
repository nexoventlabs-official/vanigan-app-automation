/**
 * services/memberDb.js  —  connection caching + model factory
 *
 * The model files (Business, Review, etc.) call conn.on() when MEMBER_MONGODB_URI
 * is set, so we need a full event-emitter-compatible mock for mongoose.createConnection.
 */
const EventEmitter = require('events');

beforeEach(() => jest.resetModules());
afterEach(() => jest.restoreAllMocks());

// Helper: create a fake mongoose connection that behaves like an EventEmitter
// and has the .model() / .models interface.
function makeFakeConn(overrides = {}) {
  const ee = new EventEmitter();
  ee.readyState = 1;
  ee.models     = {};
  ee.model = jest.fn((name) => {
    const m = { modelName: name };
    ee.models[name] = m;
    return m;
  });
  return Object.assign(ee, overrides);
}

describe('getConnection()', () => {
  test('rejects when MEMBER_MONGODB_URI is not set', async () => {
    delete process.env.MEMBER_MONGODB_URI;
    const { getConnection } = require('../services/memberDb');
    await expect(getConnection()).rejects.toThrow('MEMBER_MONGODB_URI is not configured');
  });

  test('returns same promise on concurrent calls (no double-connect)', async () => {
    process.env.MEMBER_MONGODB_URI = 'mongodb://localhost/test';

    const fakeConn = makeFakeConn();
    const mongoose = require('mongoose');
    jest.spyOn(mongoose, 'createConnection').mockReturnValue({
      asPromise: jest.fn().mockResolvedValue(fakeConn),
    });

    const { getConnection } = require('../services/memberDb');

    const [c1, c2] = await Promise.all([getConnection(), getConnection()]);
    expect(mongoose.createConnection).toHaveBeenCalledTimes(1);
    expect(c1).toBe(fakeConn);
    expect(c2).toBe(fakeConn);
  });
});

describe('model factories', () => {
  let fakeConn;

  beforeEach(async () => {
    process.env.MEMBER_MONGODB_URI = 'mongodb://localhost/test';
    fakeConn = makeFakeConn();

    const mongoose = require('mongoose');
    // Also stub createConnection for the model files that open their own conn on import
    jest.spyOn(mongoose, 'createConnection').mockReturnValue(
      Object.assign(new EventEmitter(), {
        readyState: 1,
        models: {},
        model: jest.fn((name) => ({ modelName: name })),
        asPromise: jest.fn().mockResolvedValue(fakeConn),
      })
    );
  });

  test('getMemberModel() registers VaniganMember on the connection', async () => {
    const { getMemberModel } = require('../services/memberDb');
    const Model = await getMemberModel();
    expect(fakeConn.model).toHaveBeenCalledWith('VaniganMember', expect.anything());
    expect(Model.modelName).toBe('VaniganMember');
  });

  test('getMemberModel() returns cached model on second call', async () => {
    const { getMemberModel } = require('../services/memberDb');
    const m1 = await getMemberModel();
    const m2 = await getMemberModel();
    // model() on the fake conn was called once; second call hits cache
    const callsForVaniganMember = fakeConn.model.mock.calls.filter(([n]) => n === 'VaniganMember');
    expect(callsForVaniganMember).toHaveLength(1);
    expect(m1).toBe(m2);
  });

  test('getBusinessModel() registers Business', async () => {
    const { getBusinessModel } = require('../services/memberDb');
    const Model = await getBusinessModel();
    expect(Model.modelName).toBe('Business');
  });

  test('getReviewModel() registers Review', async () => {
    const { getReviewModel } = require('../services/memberDb');
    const Model = await getReviewModel();
    expect(Model.modelName).toBe('Review');
  });

  test('getVaniganUserModel() registers VaniganUser', async () => {
    const { getVaniganUserModel } = require('../services/memberDb');
    const Model = await getVaniganUserModel();
    expect(Model.modelName).toBe('VaniganUser');
  });

  test('getOrganizerModel() registers Organizer', async () => {
    const { getOrganizerModel } = require('../services/memberDb');
    const Model = await getOrganizerModel();
    expect(Model.modelName).toBe('Organizer');
  });

  test('getMemberListingModel() registers Member', async () => {
    const { getMemberListingModel } = require('../services/memberDb');
    const Model = await getMemberListingModel();
    expect(Model.modelName).toBe('Member');
  });
});
