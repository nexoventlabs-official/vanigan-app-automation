const express = require('express');
const crypto = require('crypto');
const chatbot = require('../services/chatbot');
const meta = require('../services/metaCloud');
const flowImages = require('../services/flowImages');
const User = require('../models/User');

const router = express.Router();

/* ─── Webhook verification (Meta GET) ─── */
router.get('/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.META_VERIFY_TOKEN;
  if (!verifyToken) return res.sendStatus(500);

  if (mode === 'subscribe' && token === verifyToken) {
    return res.status(200).send(challenge);
  }
  if (!mode && !token) {
    return res.json({ status: 'webhook active' });
  }
  return res.sendStatus(403);
});

/* ─── Signature verification ─── */
function verifySignature(req) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) return false;
  const signature = req.headers['x-hub-signature-256'];
  if (!signature || !req.rawBody) return false;
  const expected =
    'sha256=' + crypto.createHmac('sha256', appSecret).update(req.rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

/* ─── Webhook receiver (Meta POST) ─── */
router.post('/meta', async (req, res) => {
  // Acknowledge immediately so Meta does not retry
  res.sendStatus(200);

  if (process.env.META_APP_SECRET && !verifySignature(req)) {
    console.warn('[webhook] invalid signature');
    return;
  }

  try {
    const body = req.body || {};
    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        const messages = value.messages || [];
        const contacts = value.contacts || [];

        for (const msg of messages) {
          const from = msg.from;
          const profileName = contacts[0]?.profile?.name || '';
          let text = '';
          const type = msg.type;

          if (msg.type === 'text') text = msg.text?.body || '';
          else if (msg.type === 'interactive') {
            const interactiveType = msg.interactive?.type;
            if (interactiveType === 'nfm_reply') {
              const rawJson = msg.interactive?.nfm_reply?.response_json || '{}';
              let flowPayload = {};
              try { flowPayload = JSON.parse(rawJson); } catch {}
              await handleNfmReply(from, profileName, flowPayload);
              continue;
            }
            text =
              msg.interactive?.button_reply?.title ||
              msg.interactive?.list_reply?.title ||
              '';
          } else if (msg.type === 'button') {
            text = msg.button?.text || '';
          }

          await chatbot.handleInbound({ phone: from, profileName, type, text });
        }
      }
    }
  } catch (err) {
    console.error('[webhook] handler error:', err.message);
  }
});

async function handleNfmReply(phone, profileName, flowPayload = {}) {
  try {
    await chatbot.trackInbound({ phone, profileName, text: '[flow_complete]' });

    // Business directory CTA — flow closed from SELECT_CATEGORY screen (complete action)
    if (flowPayload.selected_category !== undefined) {
      const { district = '', assembly = '', selected_category: category = 'All' } = flowPayload;
      const backend = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
      const params = new URLSearchParams({ district, assembly });
      if (category && category !== 'All') params.set('category', category);
      if (profileName) params.set('name', profileName);
      if (phone) params.set('phone', phone);
      const dirUrl = `${backend}/public/dir?${params.toString()}`;
      const catLabel = (category && category !== 'All') ? category : 'All Categories';
      const bannerUrl = await flowImages.getUrl('banner_business');
      await meta.sendCtaUrlMessage(phone, {
        headerImageUrl: bannerUrl || undefined,
        bodyText:
          `\uD83C\uDFEA *Businesses in ${assembly}, ${district}*\n` +
          `Category: *${catLabel}*\n\n` +
          `Tap the button below to browse the full listing with details and reviews.`,
        footerText: 'Powered by Vanigan \uD83E\uDD54',
        buttonText: '\uD83C\uDFEA View Businesses',
        url: dirUrl,
      });
      return;
    }

    // Add Business — flow closed from ADD_BUSINESS screen (complete action)
    const user = await User.findOne({ phone }).lean();
    const action = user?.pendingAction || '';

    if (action === 'add_business') {
      await User.updateOne({ phone }, { $set: { pendingAction: '' } });
      const backend = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
      const regUrl = `${backend}/public/register?phone=${encodeURIComponent(phone)}`;
      const bannerUrl = await flowImages.getUrl('banner_add_business');
      await meta.sendCtaUrlMessage(phone, {
        headerImageUrl: bannerUrl || undefined,
        bodyText: 'Register your business on Vanigan! \uD83C\uDFEA\n\nFill in your business details using the form below.',
        footerText: 'Vanigan Directory',
        buttonText: 'Register Now',
        url: regUrl,
      });
    }
  } catch (err) {
    console.error('[webhook] handleNfmReply error:', err.message);
  }
}

module.exports = router;
