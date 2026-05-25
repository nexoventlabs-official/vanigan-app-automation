const meta = require('./metaCloud');
const flowImages = require('./flowImages');
const InboundMessage = require('../models/InboundMessage');
const User = require('../models/User');

const GREETING_RE = /^(hi+|h?ello+|hey+|hai+|vanakkam|namaste|namaskar|start|menu|services|help)\b/i;

function isGreeting(text) {
  if (!text) return false;
  const t = String(text).trim();
  if (!t) return false;
  return GREETING_RE.test(t);
}

async function trackInbound({ phone, profileName, text }) {
  if (!phone) return;
  try {
    await InboundMessage.findOneAndUpdate(
      { phone },
      {
        $setOnInsert: { firstSeenAt: new Date() },
        $set: {
          profileName: profileName || '',
          lastSeenAt: new Date(),
          lastMessage: (text || '').slice(0, 500),
        },
        $inc: { messageCount: 1 },
      },
      { upsert: true }
    );
    // Mirror profile name onto the User record so it shows up everywhere.
    if (profileName) {
      await User.updateOne(
        { phone },
        { $set: { profileName } },
        { upsert: false }
      );
    }
  } catch (err) {
    console.warn('[chatbot] trackInbound failed:', err.message);
  }
}

/**
 * Send the welcome flow message: image header + body + CTA "Choose Service".
 */
async function sendWelcomeFlow(phone) {
  const flowId = process.env.WHATSAPP_FLOW_ID;
  if (!flowId) {
    await meta.sendText(
      phone,
      'Welcome to Vanigan 🪔\n\nOur directory is being set up. Please try again soon.'
    );
    return;
  }

  // Pick plan-specific header; fall back to generic chat_welcome_header
  let banner = '';
  try {
    const user = phone ? await User.findOne({ phone: String(phone).replace(/\D/g, '') }).lean() : null;
    const plan = user?.currentPlan || 'free';
    banner = await flowImages.getUrl(`chat_welcome_header_${plan}`);
    if (!banner) banner = await flowImages.getUrl('chat_welcome_header');
  } catch {
    banner = await flowImages.getUrl('chat_welcome_header');
  }

  const mode =
    String(process.env.WHATSAPP_FLOW_STATUS || '').toUpperCase() === 'PUBLISHED'
      ? 'published'
      : 'draft';

  await meta.sendFlowMessage(phone, {
    flowId,
    flowCta: 'Choose Service',
    headerImageUrl: banner || undefined,
    headerText: !banner ? 'Vanigan Directory' : undefined,
    bodyText:
      'Vanakkam 🙏\n\nWelcome to *Vanigan* — your Tamil Nadu business, organizer & member directory. Tap *Choose Service* below to explore listings or manage your subscription.',
    footerText: 'Vanigan',
    flowToken: `welcome_${phone}`,
    mode,
  });
}

/**
 * Main inbound handler. Called from the webhook.
 */
async function handleInbound({ phone, profileName, type, text }) {
  await trackInbound({ phone, profileName, text });

  if (isGreeting(text) || !text) {
    try {
      await sendWelcomeFlow(phone);
    } catch (err) {
      console.error('[chatbot] sendWelcomeFlow failed:', err.response?.data || err.message);
      await meta
        .sendText(phone, 'Welcome to Vanigan 🪔 — please type *hi* to see our services.')
        .catch(() => {});
    }
    return;
  }

  await meta
    .sendText(phone, `Vanakkam 🙏\n\nType *hi* to open the menu and choose a service.`)
    .catch(() => {});
}

module.exports = { handleInbound, sendWelcomeFlow, isGreeting, trackInbound };
