/**
 * services/chatbot.js  —  isGreeting, trackInbound, handleInbound
 */

jest.mock('../services/metaCloud', () => ({
  sendText:        jest.fn().mockResolvedValue({}),
  sendFlowMessage: jest.fn().mockResolvedValue({}),
}));
jest.mock('../services/flowImages', () => ({
  getUrl: jest.fn().mockResolvedValue('https://cdn/banner.jpg'),
}));
jest.mock('../models/InboundMessage', () => ({
  findOneAndUpdate: jest.fn().mockResolvedValue({}),
}));
jest.mock('../models/User', () => ({
  updateOne: jest.fn().mockResolvedValue({}),
  findOne:   jest.fn().mockResolvedValue(null),
}));

const chatbot     = require('../services/chatbot');
const meta        = require('../services/metaCloud');
const InboundMsg  = require('../models/InboundMessage');

afterEach(() => jest.clearAllMocks());

// ── isGreeting ────────────────────────────────────────────────────────────────
describe('isGreeting()', () => {
  const positives = ['hi', 'HI', 'hello', 'HELLO', 'hey', 'hai', 'vanakkam',
                     'namaste', 'start', 'menu', 'services', 'help',
                     'hiiii', 'hellooo'];
  const negatives = ['what is vanigan?', 'register', 'I need help with my business',
                     'price list', ''];

  positives.forEach(text => {
    test(`recognises "${text}" as greeting`, () => {
      expect(chatbot.isGreeting(text)).toBe(true);
    });
  });

  negatives.forEach(text => {
    test(`"${text}" is NOT a greeting`, () => {
      expect(chatbot.isGreeting(text)).toBe(false);
    });
  });

  test('returns false for null/undefined', () => {
    expect(chatbot.isGreeting(null)).toBe(false);
    expect(chatbot.isGreeting(undefined)).toBe(false);
  });
});

// ── trackInbound ──────────────────────────────────────────────────────────────
describe('trackInbound()', () => {
  test('upserts InboundMessage record', async () => {
    await chatbot.trackInbound({ phone: '9876543210', profileName: 'Alice', text: 'hi' });
    expect(InboundMsg.findOneAndUpdate).toHaveBeenCalledWith(
      { phone: '9876543210' },
      expect.objectContaining({ $inc: { messageCount: 1 } }),
      { upsert: true }
    );
  });

  test('does nothing when phone is falsy', async () => {
    await chatbot.trackInbound({ phone: '', text: 'hi' });
    expect(InboundMsg.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test('does not throw when InboundMessage.findOneAndUpdate rejects', async () => {
    InboundMsg.findOneAndUpdate.mockRejectedValueOnce(new Error('DB error'));
    await expect(
      chatbot.trackInbound({ phone: '9876543210', profileName: 'Bob', text: 'hi' })
    ).resolves.not.toThrow();
  });
});

// ── handleInbound ─────────────────────────────────────────────────────────────
describe('handleInbound()', () => {
  test('sends welcome flow on greeting', async () => {
    process.env.WHATSAPP_FLOW_ID = 'FLOW123';
    process.env.WHATSAPP_FLOW_STATUS = 'PUBLISHED';

    const User = require('../models/User');
    User.findOne.mockResolvedValue(null);

    await chatbot.handleInbound({ phone: '9876543210', profileName: 'Alice', type: 'text', text: 'hi' });

    expect(meta.sendFlowMessage).toHaveBeenCalledWith('9876543210', expect.objectContaining({
      flowId: 'FLOW123',
    }));
  });

  test('sends fallback text when WHATSAPP_FLOW_ID is not set', async () => {
    delete process.env.WHATSAPP_FLOW_ID;
    await chatbot.handleInbound({ phone: '9876543210', profileName: 'Alice', type: 'text', text: 'hello' });
    expect(meta.sendText).toHaveBeenCalledWith('9876543210', expect.stringContaining('Vanigan'));
  });

  test('sends generic reply for non-greeting text', async () => {
    await chatbot.handleInbound({ phone: '9876543210', profileName: 'Alice', type: 'text', text: 'I want to register a business' });
    expect(meta.sendText).toHaveBeenCalledWith('9876543210', expect.stringContaining('hi'));
  });
});
