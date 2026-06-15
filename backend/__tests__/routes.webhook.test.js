/**
 * routes/webhook.js  —  Meta webhook verification + signature check
 */
const request = require('supertest');
const express = require('express');
const crypto  = require('crypto');

jest.mock('../services/chatbot', () => ({
  handleInbound: jest.fn().mockResolvedValue(undefined),
  trackInbound:  jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../services/metaCloud', () => ({
  sendText:          jest.fn().mockResolvedValue({}),
  sendCtaUrlMessage: jest.fn().mockResolvedValue({}),
}));
jest.mock('../services/flowImages', () => ({
  getUrl: jest.fn().mockResolvedValue('https://cdn/banner.jpg'),
}));
jest.mock('../models/User', () => ({
  findOne:          jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
  findOneAndUpdate: jest.fn().mockResolvedValue({}),
  updateOne:        jest.fn().mockResolvedValue({}),
}));
jest.mock('../models/Business', () => ({
  findById: jest.fn().mockResolvedValue(null),
}));
jest.mock('../models/VaniganUser', () => ({
  findOne: jest.fn().mockResolvedValue(null),
}));

const chatbot = require('../services/chatbot');

let app;
beforeAll(() => {
  process.env.META_VERIFY_TOKEN = 'test-verify-token';
  process.env.META_APP_SECRET   = 'test-app-secret';

  app = express();
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        if (req.originalUrl.startsWith('/api/webhook/meta')) req.rawBody = buf.toString();
      },
    })
  );
  app.use('/api/webhook', require('../routes/webhook'));
});
afterEach(() => jest.clearAllMocks());

// ── GET /api/webhook/meta (Meta hub verification) ────────────────────────────
describe('GET /api/webhook/meta', () => {
  test('200 returns challenge when token matches', async () => {
    const res = await request(app).get('/api/webhook/meta').query({
      'hub.mode':         'subscribe',
      'hub.verify_token': 'test-verify-token',
      'hub.challenge':    'CHALLENGE_STRING',
    });
    expect(res.status).toBe(200);
    expect(res.text).toBe('CHALLENGE_STRING');
  });

  test('403 when token does not match', async () => {
    const res = await request(app).get('/api/webhook/meta').query({
      'hub.mode':         'subscribe',
      'hub.verify_token': 'wrong-token',
      'hub.challenge':    'XYZ',
    });
    expect(res.status).toBe(403);
  });

  test('json {status: webhook active} when no hub params', async () => {
    const res = await request(app).get('/api/webhook/meta');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('webhook active');
  });
});

// ── POST /api/webhook/meta (inbound messages) ────────────────────────────────
function makeSignature(body) {
  return 'sha256=' + crypto.createHmac('sha256', 'test-app-secret').update(body).digest('hex');
}

function buildPayload(text, wamid = 'wamid.test.001') {
  return {
    object: 'whatsapp_business_account',
    entry: [{
      changes: [{
        value: {
          messages: [{ id: wamid, from: '919876543210', type: 'text', text: { body: text } }],
          contacts: [{ profile: { name: 'Alice' } }],
        },
      }],
    }],
  };
}

test('200 immediately (Meta expects fast ack)', async () => {
  const body = JSON.stringify(buildPayload('hi'));
  const sig  = makeSignature(body);

  const res = await request(app)
    .post('/api/webhook/meta')
    .set('Content-Type', 'application/json')
    .set('x-hub-signature-256', sig)
    .send(body);

  expect(res.status).toBe(200);
});

test('calls chatbot.handleInbound for text messages with valid signature', async () => {
  const body = JSON.stringify(buildPayload('hello', 'wamid.test.002'));
  const sig  = makeSignature(body);

  await request(app)
    .post('/api/webhook/meta')
    .set('Content-Type', 'application/json')
    .set('x-hub-signature-256', sig)
    .send(body);

  await new Promise(r => setImmediate(r));
  expect(chatbot.handleInbound).toHaveBeenCalledWith(
    expect.objectContaining({ phone: '919876543210', text: 'hello' })
  );
});

test('drops payload with invalid signature (FIX 1.2)', async () => {
  const body = JSON.stringify(buildPayload('should-be-dropped', 'wamid.test.003'));
  // Wrong signature
  await request(app)
    .post('/api/webhook/meta')
    .set('Content-Type', 'application/json')
    .set('x-hub-signature-256', 'sha256=badhash')
    .send(body);

  await new Promise(r => setImmediate(r));
  expect(chatbot.handleInbound).not.toHaveBeenCalled();
});

test('deduplicates messages with same wamid (FIX 1.3)', async () => {
  const payload = buildPayload('dup-message', 'wamid.DUPLICATE');
  const body = JSON.stringify(payload);
  const sig  = makeSignature(body);

  // First delivery
  await request(app)
    .post('/api/webhook/meta')
    .set('Content-Type', 'application/json')
    .set('x-hub-signature-256', sig)
    .send(body);

  // Simulated Meta retry — same wamid
  await request(app)
    .post('/api/webhook/meta')
    .set('Content-Type', 'application/json')
    .set('x-hub-signature-256', sig)
    .send(body);

  await new Promise(r => setImmediate(r));
  // handleInbound should only be called ONCE despite two deliveries
  expect(chatbot.handleInbound).toHaveBeenCalledTimes(1);
});

test('ignores payload with wrong object type', async () => {
  const payload = { object: 'page', entry: [] };
  const body    = JSON.stringify(payload);
  const sig     = makeSignature(body);

  await request(app)
    .post('/api/webhook/meta')
    .set('Content-Type', 'application/json')
    .set('x-hub-signature-256', sig)
    .send(body);

  await new Promise(r => setImmediate(r));
  expect(chatbot.handleInbound).not.toHaveBeenCalled();
});

test('skips status update entries (FIX 9.2)', async () => {
  const payload = {
    object: 'whatsapp_business_account',
    entry: [{
      changes: [{
        value: {
          statuses: [{ id: 'wamid.status.001', status: 'delivered', timestamp: '12345' }],
          messages: [],
        },
      }],
    }],
  };
  const body = JSON.stringify(payload);
  const sig  = makeSignature(body);

  await request(app)
    .post('/api/webhook/meta')
    .set('Content-Type', 'application/json')
    .set('x-hub-signature-256', sig)
    .send(body);

  await new Promise(r => setImmediate(r));
  expect(chatbot.handleInbound).not.toHaveBeenCalled();
});
