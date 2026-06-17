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

  // FIX 1.1: Use constant-time comparison to prevent timing attacks
  if (mode === 'subscribe' && token) {
    try {
      const tokBuf = Buffer.from(token);
      const verBuf = Buffer.from(verifyToken);
      if (tokBuf.length === verBuf.length && crypto.timingSafeEqual(tokBuf, verBuf)) {
        return res.status(200).send(challenge);
      }
    } catch {
      // length mismatch or other error — fall through to 403
    }
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
// FIX 1.3: In-process wamid dedup set (resets on restart — acceptable for single-instance)
const processedWamids = new Set();
// Prune old entries every 30 min to prevent unbounded memory growth
setInterval(() => processedWamids.clear(), 30 * 60 * 1000);

router.post('/meta', async (req, res) => {
  // Acknowledge immediately so Meta does not retry
  res.sendStatus(200);

  // FIX 1.2: Always verify signature — no conditional skip based on env presence
  if (!verifySignature(req)) {
    console.warn('[webhook] invalid or missing signature — dropping request');
    return;
  }

  try {
    const body = req.body || {};
    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};

        // FIX 9.2: Explicitly skip status updates (delivery/read receipts)
        if (value.statuses && value.statuses.length > 0) continue;

        const messages = value.messages || [];
        const contacts = value.contacts || [];

        for (const msg of messages) {
          // FIX 1.3: Deduplicate by wamid to prevent double-processing on Meta retries
          const wamid = msg.id;
          if (!wamid || processedWamids.has(wamid)) continue;
          processedWamids.add(wamid);

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

    // ── Become a Member ──────────────────────────────────────────────────────
    if (flowPayload.action === 'become_member') {
      await handleBecomeMember(phone, normalizedPhone, profileName, flowPayload);
      return;
    }

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

    // My Card — send membership card image
    if (action === 'my_card') {
      await User.updateOne(
        { phone: { $in: [phone, normalizedPhone] } },
        { $set: { pendingAction: '' } }
      );
      await handleSendMemberCard(phone, normalizedPhone);
      return;
    }

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

      // Look up VaniganUser for pre-fill data they may have saved during web signup
      let webUser = null;
      try {
        const VaniganUser = require('../models/VaniganUser');
        webUser = await VaniganUser.findOne({ phone: normalizedPhone })
          .select('district assembly bizCategory bizSubCat bizName')
          .lean();
      } catch {}

      const regParams = new URLSearchParams();
      regParams.set('phone', normalizedPhone);
      if (webUser?.district)    regParams.set('district',    webUser.district);
      if (webUser?.assembly)    regParams.set('assembly',    webUser.assembly);
      if (webUser?.bizCategory) regParams.set('category',    webUser.bizCategory);
      if (webUser?.bizSubCat)   regParams.set('subCategory', webUser.bizSubCat);
      if (webUser?.bizName)     regParams.set('bizName',     webUser.bizName);

      const regUrl = `${backend}/public/register?${regParams.toString()}`;
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

/* ── Become a Member handler ─────────────────────────────────────────────── */
async function handleBecomeMember(phone, normalizedPhone, profileName, payload) {
  const bcrypt = require('bcryptjs');
  const cryptoN = require('crypto');
  const { getMemberModel } = require('../services/memberDb');
  const { getZoneByDistrict, calculateAge } = require('../utils/zoneData');
  const { generateAndUploadCard } = require('../services/memberCard');

  // 1. Validate PIN
  const pin = String(payload.pin || '').trim();
  const confirmPin = String(payload.confirm_pin || '').trim();
  if (!/^\d{4}$/.test(pin)) {
    await meta.sendText(phone, '❌ PIN must be exactly 4 digits. Please type *hi* and try again.');
    return;
  }
  if (pin !== confirmPin) {
    await meta.sendText(phone, '❌ PINs do not match. Please type *hi* and try again.');
    return;
  }

  // 2. Extract voter-confirmed data from payload (passed through all screens)
  const name        = String(payload.voter_name    || profileName || '').trim();
  const epicNo      = String(payload.epic_no       || '').toUpperCase().trim();
  const district    = String(payload.voter_district || '').trim();
  const assemblyName= String(payload.voter_assembly || '').trim();
  const assemblyNo  = String(payload.voter_assembly_no || '').trim();
  const gender      = String(payload.voter_gender   || '').trim();
  const zone        = String(payload.voter_zone     || '') || getZoneByDistrict(district);

  // 3. User-entered fields — DOB from DatePicker comes as Unix ms timestamp or YYYY-MM-DD string
  const rawDob = String(payload.dob || '').trim();
  // Convert to DD/MM/YYYY for storage and card display
  let dob = rawDob;
  if (rawDob && /^\d{10,13}$/.test(rawDob)) {
    // Unix timestamp (ms from DatePicker)
    const ms = rawDob.length === 10 ? parseInt(rawDob) * 1000 : parseInt(rawDob);
    const dt = new Date(ms);
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = dt.getUTCFullYear();
    dob = `${dd}/${mm}/${yyyy}`;
  } else if (rawDob && rawDob.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // ISO date string YYYY-MM-DD
    const [y, m, d] = rawDob.split('-');
    dob = `${d}/${m}/${y}`;
  }
  const bloodGroup = String(payload.blood_group || '').trim();
  const address    = String(payload.address    || '').trim();
  const age        = calculateAge(dob);  // auto-calculated from DOB

  if (!name) {
    await meta.sendText(phone, '❌ Name is required. Please type *hi* and try again.');
    return;
  }

  const VaniganMember = await getMemberModel();

  // 4. Check duplicate
  const existing = await VaniganMember.findOne({ phone: normalizedPhone }).lean();
  if (existing) {
    await handleSendMemberCard(phone, normalizedPhone);
    return;
  }

  // 5. Generate membership ID
  let membershipId;
  do {
    membershipId = 'TNVS-' + cryptoN.randomBytes(4).toString('hex').toUpperCase();
  } while (await VaniganMember.findOne({ membershipId }).select('_id').lean());

  // 6. Generate referral code
  let referralCode;
  do {
    referralCode = 'REF-' + cryptoN.randomBytes(4).toString('hex').toUpperCase();
  } while (await VaniganMember.findOne({ referralCode }).select('_id').lean());

  // 7. Hash PIN and create member
  const pinHash = await bcrypt.hash(pin, 10);
  const member = await VaniganMember.create({
    membershipId, referralCode,
    phone: normalizedPhone,
    pinHash, name,
    hasEpic: !!epicNo, epicNo,
    assemblyName, assemblyNo, district, zone,
    dob, age, bloodGroup, gender,
    businessAddress: address,
    photoUrl: '', photoPublicId: '',
    active: true,
  });

  // 8. Send ONLY the photo upload CTA — welcome + card sent after photo upload
  const backend = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
  const photoUploadUrl = `${backend}/public/upload-photo?phone=${encodeURIComponent(normalizedPhone)}`;
  await meta.sendCtaUrlMessage(phone, {
    bodyText:
      `🎉 *Welcome to Vanigan, ${name}!*\n\n` +
      `✅ Membership confirmed!\n` +
      `🪪 ID: *${membershipId}*\n` +
      `📍 ${assemblyName}, ${district}\n\n` +
      `📸 *One last step* — upload your profile photo to complete your membership card.\n\n` +
      `Tap the button below to upload and crop your photo. Your membership card will be generated and sent to you automatically after upload. 🪪`,
    footerText: 'Vanigan Membership',
    buttonText: '📸 Upload My Photo',
    url: photoUploadUrl,
  });
}

/* ── Send Membership Card handler ────────────────────────────────────────── */
async function handleSendMemberCard(phone, normalizedPhone) {
  const { getMemberModel } = require('../services/memberDb');
  const { generateAndUploadCard } = require('../services/memberCard');

  const VaniganMember = await getMemberModel();
  const member = await VaniganMember.findOne({ phone: normalizedPhone }).lean();

  if (!member) {
    await meta.sendText(phone,
      '❌ No membership found for your number.\n\nType *hi* and choose *Become a Member* to sign up!'
    );
    return;
  }

  await meta.sendText(phone, '⏳ Generating your membership card… please wait a moment.');

  try {
    const { url } = await generateAndUploadCard(member);
    await meta.sendImage(phone, url,
      `🪪 *Your Vanigan Membership Card*\n` +
      `ID: *${member.membershipId}*\n` +
      `${member.name}  |  ${member.assemblyName}, ${member.district}\n\n` +
      `Type *hi* to open the menu.`
    );
  } catch (err) {
    console.error('[webhook] send card failed:', err.message);
    const siteUrl = (process.env.USER_WEBSITE_URL || 'https://vanigan.digital').replace(/\/+$/, '');
    await meta.sendCtaUrlMessage(phone, {
      bodyText:
        `🪪 *Your Vanigan Membership Card*\n` +
        `ID: *${member.membershipId}*\n\n` +
        `View and download your card on the Vanigan website.`,
      footerText: 'Vanigan',
      buttonText: '🪪 View My Card',
      url: `${siteUrl}?page=membercard`,
    });
  }
}

module.exports = router;
