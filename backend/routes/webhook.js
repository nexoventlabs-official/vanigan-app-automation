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
              // Flow completed — check if user has a pending action
              await handleNfmReply(from, profileName);
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

async function handleNfmReply(phone, profileName) {
  try {
    await chatbot.trackInbound({ phone, profileName, text: '[flow_complete]' });

    const user = await User.findOne({ phone }).lean();
    const action = user?.pendingAction || '';

    if (action === 'add_business') {
      // Clear the pending action first
      await User.updateOne({ phone }, { $set: { pendingAction: '' } });

      const backend = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
      const regUrl = `${backend}/public/register?phone=${encodeURIComponent(phone)}`;
      const bannerUrl = await flowImages.getUrl('banner_add_business');

      await meta.sendCtaUrlMessage(phone, {
        headerImageUrl: bannerUrl || undefined,
        bodyText: 'Register your business on Vanigan! 🏪\n\nFill in your business details using the form below.',
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
