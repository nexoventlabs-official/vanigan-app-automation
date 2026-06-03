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

    // Normalize phone — strip 91 country code if present (Meta sends E.164)
    const normalizedPhone = (() => {
      const d = String(phone).replace(/\D/g, '');
      return (d.length === 12 && d.startsWith('91')) ? d.slice(2) : d;
    })();

    // Business directory CTA — flow closed from SELECT_SUBCATEGORY screen
    if (flowPayload.selected_category !== undefined) {
      const {
        district = '', assembly = '',
        selected_category: category = '',
        selected_subcategory: subcategory = '',
      } = flowPayload;
      const backend = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
      const params = new URLSearchParams({ district, assembly });
      if (category) params.set('category', category);
      if (subcategory && subcategory !== 'All') params.set('subcategory', subcategory);
      if (profileName) params.set('name', profileName);
      if (phone) params.set('phone', phone);
      const dirUrl = `${backend}/public/dir?${params.toString()}`;
      const catLabel = category || 'All Categories';
      const subLabel = (subcategory && subcategory !== 'All') ? ` → ${subcategory}` : '';
      const bannerUrl = await flowImages.getUrl('banner_business');
      await meta.sendCtaUrlMessage(phone, {
        headerImageUrl: bannerUrl || undefined,
        bodyText:
          `🏪 *Businesses in ${assembly}, ${district}*\n` +
          `Category: *${catLabel}${subLabel}*\n\n` +
          `Tap the button below to browse the full listing with details and reviews.`,
        footerText: 'Powered by Vanigan',
        buttonText: '🏪 View Businesses',
        url: dirUrl,
      });
      return;
    }

    // Check pendingAction for both E.164 and 10-digit phone
    const user = await User.findOne({
      phone: { $in: [phone, normalizedPhone] },
    }).lean();
    const action = user?.pendingAction || '';

    // My Business — flow closed from INFO screen after my_business selection
    if (action.startsWith('my_business:')) {
      const bizId = action.split(':')[1];
      // Clear pendingAction using whichever phone key matched
      await User.updateOne(
        { phone: { $in: [phone, normalizedPhone] } },
        { $set: { pendingAction: '' } }
      );

      const Business = require('../models/Business');
      let doc = null;
      try { doc = await Business.findById(bizId).lean(); } catch {}

      if (!doc) {
        await meta.sendText(phone,
          '🏪 Your business listing could not be found. Please type *hi* and try again.'
        );
        return;
      }

      const backend = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
      // Use normalizedPhone (10-digit) in the URL so the edit/delete owner check works
      const bizUrl = `${backend}/public/dir/${doc._id}?phone=${encodeURIComponent(normalizedPhone)}`;
      const statusLine = doc.active ? '✅ Active' : '⏳ Pending Review — our team will activate it shortly';
      const lines = [
        `🏪 *${doc.name}*`,
        statusLine,
        '',
      ];
      if (doc.category) lines.push(`🏷️ ${doc.category}${doc.subCategory ? ` › ${doc.subCategory}` : ''}`);
      if (doc.listingCode) lines.push(`📋 Code: ${doc.listingCode}`);
      if (doc.address) lines.push(`📍 ${doc.address}`);
      if (doc.city) lines.push(`🏙️ ${doc.city}${doc.pincode ? ` – ${doc.pincode}` : ''}`);
      if (doc.phone || doc.whatsappNo) lines.push(`📞 ${doc.phone || doc.whatsappNo}`);
      if (doc.openDays) {
        const timeStr = [doc.openTime, doc.closeTime].filter(Boolean).join(' – ');
        lines.push(`🕐 ${[doc.openDays, timeStr].filter(Boolean).join('  |  ')}`);
      }
      lines.push('');
      lines.push('Tap the button below to view your full listing, edit details, or manage your business.');

      await meta.sendCtaUrlMessage(phone, {
        headerImageUrl: doc.coverImage || doc.image || undefined,
        bodyText: lines.join('\n'),
        footerText: 'Vanigan Directory',
        buttonText: 'Manage My Business',
        url: bizUrl,
      });
      return;
    }

    // Add Business — flow closed from ADD_BUSINESS screen
    if (action === 'add_business') {
      await User.updateOne(
        { phone: { $in: [phone, normalizedPhone] } },
        { $set: { pendingAction: '' } }
      );
      const backend = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
      const regUrl = `${backend}/public/register?phone=${encodeURIComponent(normalizedPhone)}`;
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
