/**
 * WhatsApp Flow Endpoint — RSA + AES-128-GCM encrypted exchange.
 *
 * Handles INIT / data_exchange / BACK / ping actions from Meta and returns
 * the next screen with dynamic content (districts, assemblies, businesses,
 * organizers, members, plan tiles, review submissions).
 */
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const flowImages  = require('../services/flowImages');
const CATEGORIES  = require('../services/categories');
const districts = require('../services/districts');
const { urlToBase64 } = require('../services/imageBase64');
const meta = require('../services/metaCloud');

const User = require('../models/User');
const Business = require('../models/Business');
const Plan = require('../models/Plan');
const Review = require('../models/Review');
const CategoryImage   = require('../models/CategoryImage');
const { getOrganizerModel, getMemberListingModel, getMemberModel } = require('../services/memberDb');
const { findSeedBusinesses, findSeedBusinessById, findSeedOrganizers, findSeedOrganizerById } = require('../services/seedDb');
const SUB_CATEGORIES  = require('../utils/subCategories');
const { getZoneByDistrict, calculateAge } = require('../utils/zoneData');
const crypto_mod = require('crypto');

const router = express.Router();

const LOG_PATH = path.join(__dirname, '..', 'flow-debug.log');
function dbg(...args) {
  // FIX 6.2: Never log PII (phone, flow payloads) in production
  if (process.env.NODE_ENV === 'production') return;
  const line =
    `[${new Date().toISOString()}] ` +
    args
      .map((a) => (typeof a === 'string' ? a : JSON.stringify(a, null, 2)))
      .join(' ') +
    '\n';
  try {
    fs.appendFileSync(LOG_PATH, line);
  } catch {}
  console.log('[FlowEndpoint]', ...args);
}

/* ───────── Encryption helpers ───────── */

// FIX 7.3: Support Render Secret File path for FLOW_PRIVATE_KEY.
// Preferred: upload flow_keys/private.pem as a Render Secret File at /etc/secrets/flow_private.pem
// Fallback: FLOW_PRIVATE_KEY env var (with escaped newlines, as before)
let FLOW_PRIVATE_KEY = '';
const SECRET_FILE_PATH = '/etc/secrets/flow_private.pem';
try {
  if (fs.existsSync(SECRET_FILE_PATH)) {
    FLOW_PRIVATE_KEY = fs.readFileSync(SECRET_FILE_PATH, 'utf8').trim();
  }
} catch { /* file doesn't exist yet — fall through to env var */ }

if (!FLOW_PRIVATE_KEY) {
  const raw = process.env.FLOW_PRIVATE_KEY || '';
  FLOW_PRIVATE_KEY = raw.split('\\n').join('\n');
}

function decryptRequest(body) {
  // FIX C3: Remove plain JSON fallback — always require encryption
  if (!FLOW_PRIVATE_KEY) {
    throw new Error('FLOW_PRIVATE_KEY is not configured — cannot decrypt flow request');
  }

  const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body || {};
  if (!encrypted_aes_key || !encrypted_flow_data || !initial_vector) {
    throw new Error('Missing encryption fields');
  }

  const privateKey = crypto.createPrivateKey({ key: FLOW_PRIVATE_KEY, format: 'pem' });
  const aesKeyBuffer = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(encrypted_aes_key, 'base64')
  );

  const ivBuffer = Buffer.from(initial_vector, 'base64');
  const flowDataBuffer = Buffer.from(encrypted_flow_data, 'base64');
  const TAG_LEN = 16;
  const authTag = flowDataBuffer.slice(-TAG_LEN);
  const ciphertext = flowDataBuffer.slice(0, -TAG_LEN);

  // FIX 2.2: Detect AES key length — support both 128-bit (16 bytes) and 256-bit (32 bytes)
  const alg = aesKeyBuffer.length === 32 ? 'aes-256-gcm' : 'aes-128-gcm';
  const decipher = crypto.createDecipheriv(alg, aesKeyBuffer, ivBuffer);
  decipher.setAuthTag(authTag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  const decryptedBody = JSON.parse(plain.toString('utf-8'));

  return { decryptedBody, aesKeyBuffer, ivBuffer };
}

function encryptResponse(obj, aesKeyBuffer, ivBuffer) {
  if (!aesKeyBuffer || !ivBuffer) return obj;

  // Flip IV bits for response
  const flipped = Buffer.alloc(ivBuffer.length);
  for (let i = 0; i < ivBuffer.length; i++) flipped[i] = ~ivBuffer[i] & 0xff;

  // Match cipher algorithm to key length
  const alg = aesKeyBuffer.length === 32 ? 'aes-256-gcm' : 'aes-128-gcm';
  const cipher = crypto.createCipheriv(alg, aesKeyBuffer, flipped);
  const out = Buffer.concat([
    cipher.update(JSON.stringify(obj), 'utf-8'),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  return out.toString('base64');
}

/* ───────── Image cache (10 min, manually invalidated on admin upload) ───────── */

let imgCache = { data: null, ts: 0 };
const IMG_TTL = 10 * 60 * 1000;

function clearImageCache() {
  imgCache = { data: null, ts: 0 };
}

async function loadImagesB64() {
  if (imgCache.data && Date.now() - imgCache.ts < IMG_TTL) return imgCache.data;

  const keys = [
    'flow_welcome_banner',
    'icon_business_list',
    'icon_organizer_list',
    'icon_member_list',
    'icon_add_business',
    'icon_my_business',
    'banner_business',
    'banner_organizer',
    'banner_member',
    'banner_add_business',
    'banner_review',
    'icon_plan_free',
    'icon_plan_premium',
    'icon_plan_premium_plus',
  ];
  const map = await flowImages.getMap(keys);

  const entries = await Promise.all(
    keys.map(async (k) => {
      const url = map[k];
      if (!url) return [k, ''];
      const isIcon = k.startsWith('icon_');
      const opts = isIcon
        ? { width: 200, height: 200, crop: 'fill', quality: 75, format: 'jpg' }
        : { width: 1000, height: 125, crop: 'fill', quality: 70, format: 'jpg' };
      const b64 = await urlToBase64(url, opts);
      return [k, b64];
    })
  );
  const data = Object.fromEntries(entries);
  imgCache = { data, ts: Date.now() };
  return data;
}

/* ───────── Helpers ───────── */

function withImage(item, b64) {
  if (b64) item.image = b64;
  return item;
}

function phoneFromToken(token) {
  if (!token) return '';
  let digits = String(token).replace(/^welcome_/, '').replace(/\D/g, '');
  // Meta sends phone in E.164 (91XXXXXXXXXX = 12 digits). Strip leading 91 country code.
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  return digits;
}

function modelFor(kind) {
  if (kind === 'business') return Promise.resolve(Business);
  if (kind === 'organizer') return getOrganizerModel();
  if (kind === 'member') return getMemberListingModel();
  return Promise.resolve(null);
}

function kindLabel(kind, plural = false) {
  const map = {
    business: plural ? 'Businesses' : 'Business',
    organizer: plural ? 'Organizers' : 'Organizer',
    member: plural ? 'Members' : 'Member',
  };
  return map[kind] || (plural ? 'Items' : 'Item');
}

function kindBannerKey(kind) {
  if (kind === 'business') return 'banner_business';
  if (kind === 'organizer') return 'banner_organizer';
  if (kind === 'member') return 'banner_member';
  return '';
}

async function buildServiceList(images, phone = '') {
  let hasBusiness = false;
  let isMember = false;
  if (phone) {
    try { hasBusiness = !!(await Business.findOne({ ownerPhone: phone }).select('_id').lean()); } catch {}
    try {
      const VM = await getMemberModel();
      isMember = !!(await VM.findOne({ phone }).select('_id').lean());
    } catch {}
  }

  const list = [
    withImage({ id: 'business',  title: 'Business List',  description: 'Local businesses by district' }, images.icon_business_list),
    withImage({ id: 'organizer', title: 'Organizer List', description: 'Community organizers' },         images.icon_organizer_list),
    withImage({ id: 'member',    title: 'Members List',   description: 'Vanigan members directory' },    images.icon_member_list),
  ];

  if (!isMember) {
    // Not a member yet — show "Become a Member", hide Add Business
    list.push(withImage({ id: 'become_member', title: 'Become a Member', description: 'Get your Vanigan membership card' }, images.icon_member_list));
  } else {
    // Already a member — show card + business options
    list.push(withImage({ id: 'my_card', title: 'My Membership Card', description: 'View & share your member card' }, images.icon_member_list));
    if (!hasBusiness) {
      list.push(withImage({ id: 'add_business', title: 'Add Your Business', description: 'Register your business' }, images.icon_add_business));
    } else {
      list.push(withImage({ id: 'my_business', title: 'My Business', description: 'View your listings' }, images.icon_my_business));
    }
  }

  return list;
}

function buildDistrictOptions() {
  return districts.getDistricts().map((d) => ({ id: d, title: d }));
}

function buildAssemblyOptions(district) {
  return districts.getAssemblies(district).map((a) => ({ id: a, title: a }));
}

async function buildItemList(kind, district, assembly) {
  if (kind === 'business') {
    // Merge new businesses (MEMBER_MONGODB_URI) + seed businesses (BUSINESS_MONGODB_URI)
    const filter = { district, assembly, active: true };
    const [newDocs, seedDocs] = await Promise.all([
      Business.find(filter).sort({ name: 1 }).limit(10).lean().catch(() => []),
      findSeedBusinesses(filter, { sort: { name: 1 }, skip: 0, limit: 10 }),
    ]);
    // Deduplicate by phone, new listings take priority
    const seenPhones = new Set(newDocs.map(b => b.phone).filter(Boolean));
    const filteredSeed = seedDocs.filter(b => !b.phone || !seenPhones.has(b.phone));
    // FIX 5.2: Cap at 10 items to stay well under Meta's ~256 KB response limit
    const merged = [...newDocs, ...filteredSeed]
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      .slice(0, 10);

    return Promise.all(merged.map(async (it) => {
      const item = {
        id: it._id.toString(),
        title: (it.name || 'Business').substring(0, 30),
        description: (it.description || it.category || '').substring(0, 60),
      };
      if (it.image) {
        // FIX 5.2: Reduced dimensions and quality to keep payload small
        const b64 = await urlToBase64(it.image, { width: 150, height: 150, crop: 'fill', quality: 50, format: 'jpg' });
        if (b64) item.image = b64;
      }
      return item;
    }));
  }

  if (kind === 'organizer') {
    // Merge live organizers (MEMBER_MONGODB_URI) + seed organizers (BUSINESS_MONGODB_URI)
    const Organizer = await getOrganizerModel();
    const liveFilter = { district, active: true };
    const seedFilter = { district: new RegExp(district, 'i'), active: true };
    const [liveDocs, seedDocs] = await Promise.all([
      Organizer.find(liveFilter).sort({ name: 1 }).limit(10).lean().catch(() => []),
      findSeedOrganizers(seedFilter, { sort: { name: 1 }, skip: 0, limit: 10 }),
    ]);
    const livePhones = new Set(liveDocs.map(o => o.phone).filter(Boolean));
    const filteredSeed = seedDocs.filter(o => !o.phone || !livePhones.has(o.phone));
    const merged = [...liveDocs, ...filteredSeed]
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      .slice(0, 10);

    return Promise.all(merged.map(async (it) => {
      const item = {
        id: it._id.toString(),
        title: (it.name || 'Organizer').substring(0, 30),
        description: (it.role || it.description || it.designation || '').substring(0, 60),
      };
      if (it.image) {
        const b64 = await urlToBase64(it.image, { width: 150, height: 150, crop: 'fill', quality: 50, format: 'jpg' });
        if (b64) item.image = b64;
      }
      return item;
    }));
  }

  const M = await modelFor(kind);
  if (!M) return [];
  const items = await M.find({ district, assembly, active: true }).sort({ name: 1 }).limit(10).lean();

  return Promise.all(
    items.map(async (it) => {
      const item = {
        id: it._id.toString(),
        title: (it.name || kindLabel(kind)).substring(0, 30),
        description: (it.description || it.category || it.role || it.designation || '').substring(0, 60),
      };
      if (it.image) {
        const b64 = await urlToBase64(it.image, {
          width: 150,
          height: 150,
          crop: 'fill',
          quality: 50,
          format: 'jpg',
        });
        if (b64) item.image = b64;
      }
      return item;
    })
  );
}

async function buildPlanList(currentPlan) {
  let plans = await Plan.find({ active: true }).sort({ sortOrder: 1, createdAt: 1 }).lean();
  if (!plans.length) {
    // Fallback defaults so the screen never breaks even before the admin seeds plans.
    plans = [
      { code: 'free', name: 'Free', description: '', priceLabel: '₹0 / month', image: '' },
      { code: 'premium', name: 'Premium', description: '', priceLabel: '₹99 / month', image: '' },
      { code: 'premium_plus', name: 'Premium Plus', description: '', priceLabel: '₹199 / month', image: '' },
    ];
  }

  const images = await loadImagesB64();
  const fallback = {
    free: images.icon_plan_free,
    premium: images.icon_plan_premium,
    premium_plus: images.icon_plan_premium_plus,
  };

  return Promise.all(
    plans.map(async (p) => {
      const isCurrent = p.code === currentPlan;
      const title = isCurrent ? `${p.name} (Current Plan)` : p.name;
      const desc = [p.priceLabel, p.description].filter(Boolean).join(' — ').substring(0, 80) || '';
      const item = { id: p.code, title: title.substring(0, 30), description: desc };
      let b64 = '';
      if (p.image) {
        b64 = await urlToBase64(p.image, {
          width: 200,
          height: 200,
          crop: 'fill',
          quality: 75,
          format: 'jpg',
        });
      }
      if (!b64) b64 = fallback[p.code] || '';
      if (b64) item.image = b64;
      return item;
    })
  );
}

function ratingOptions() {
  return [
    { id: '5', title: '★★★★★ Excellent' },
    { id: '4', title: '★★★★☆ Very Good' },
    { id: '3', title: '★★★☆☆ Good' },
    { id: '2', title: '★★☆☆☆ Fair' },
    { id: '1', title: '★☆☆☆☆ Poor' },
  ];
}

async function reviewSummary(kind, itemId) {
  try {
    const reviews = await Review.find({ targetKind: kind, targetId: itemId })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    if (!reviews.length) return { meta: 'No reviews yet — be the first to review!', recent: '' };

    const total = await Review.countDocuments({ targetKind: kind, targetId: itemId });
    const avg =
      (await Review.aggregate([
        { $match: { targetKind: kind, targetId: reviews[0].targetId } },
        { $group: { _id: null, avg: { $avg: '$rating' } } },
      ]))[0]?.avg || 0;

    const stars = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
    const meta = `${stars}  ${avg.toFixed(1)} / 5  •  ${total} review${total > 1 ? 's' : ''}`;
    const recent = reviews
      .map((r) => `${'★'.repeat(r.rating)} ${r.reviewerName || 'WhatsApp user'}\n${r.text || ''}`)
      .join('\n\n')
      .substring(0, 400);
    return { meta, recent };
  } catch (err) {
    return { meta: '', recent: '' };
  }
}

/* ───────── Handler ───────── */

router.post('/', async (req, res) => {
  let aesKeyBuffer, ivBuffer, decryptedBody;
  try {
    ({ decryptedBody, aesKeyBuffer, ivBuffer } = decryptRequest(req.body));
  } catch (err) {
    console.error('[FlowEndpoint] decrypt failed:', err.message);
    return res.status(421).send();
  }

  const { action, screen, data, flow_token, version } = decryptedBody || {};
  dbg('REQUEST', { action, screen, flow_token, version, data });

  if (action === 'ping') {
    return sendResponse(res, { data: { status: 'active' } }, aesKeyBuffer, ivBuffer);
  }

  if (data?.error) {
    dbg('CLIENT_ERROR', data);
    return sendResponse(res, { data: { acknowledged: true } }, aesKeyBuffer, ivBuffer);
  }

  try {
    let response;

    if (action === 'INIT' || action === 'BACK') {
      response = await handleInit(flow_token);
    } else if (action === 'data_exchange') {
      response = await handleDataExchange({ screen, data, flow_token });
    } else {
      response = await handleInit(flow_token);
    }

    dbg('RESPONSE', { screen: response?.screen, dataKeys: Object.keys(response?.data || {}) });
    return sendResponse(res, response, aesKeyBuffer, ivBuffer);
  } catch (err) {
    console.error('[FlowEndpoint] HANDLER_ERROR:', err.message, err.stack?.split('\n')[1]);
    const fallback = {
      screen: 'INFO',
      data: {
        info_title: 'Something went wrong',
        info_body: 'Please try again later.',
      },
    };
    return sendResponse(res, fallback, aesKeyBuffer, ivBuffer);
  }
});

function sendResponse(res, obj, aesKeyBuffer, ivBuffer) {
  const payload = { version: '3.0', ...obj };
  const out = encryptResponse(payload, aesKeyBuffer, ivBuffer);
  if (typeof out === 'string') {
    res.set('Content-Type', 'text/plain');
    return res.send(out);
  }
  return res.json(out);
}

/* ───────── INIT ───────── */
async function handleInit(flow_token) {
  const phone = phoneFromToken(flow_token);
  const images = await loadImagesB64();
  const services = await buildServiceList(images, phone);

  return {
    screen: 'SERVICE_SELECT',
    data: {
      welcome_banner: images.flow_welcome_banner || '',
      has_welcome_banner: !!images.flow_welcome_banner,
      services,
    },
  };
}

/* ───────── data_exchange ───────── */
async function handleDataExchange({ screen, data, flow_token }) {
  const phone = phoneFromToken(flow_token);
  const images = await loadImagesB64();

  // ─── From SERVICE_SELECT — route to next screen ───
  if (screen === 'SERVICE_SELECT') {
    const sel = data?.selected_service;

    if (sel === 'become_member') {
      const bannerUrl = images.flow_welcome_banner || '';
      return {
        screen: 'EPIC_LOOKUP',
        data: {
          screen_banner:     bannerUrl,
          has_screen_banner: !!bannerUrl,
        },
      };
    }

    if (sel === 'my_card') {
      // Store pending action so webhook sends card after nfm_reply
      if (phone) {
        await User.findOneAndUpdate(
          { phone },
          { $set: { pendingAction: 'my_card' } },
          { upsert: true }
        ).catch(() => {});
      }
      return {
        screen: 'INFO',
        data: {
          info_title: '🪪 Membership Card',
          info_body: 'Your membership card is being generated and will be sent to you on WhatsApp in a moment. 🙏',
        },
      };
    }

    if (sel === 'add_business') {
      // Save pendingAction — webhook will send the CTA after nfm_reply from ADD_BUSINESS screen
      if (phone) {
        await User.findOneAndUpdate(
          { phone },
          { $set: { pendingAction: 'add_business' } },
          { upsert: true }
        ).catch(() => {});
      }
      return {
        screen: 'ADD_BUSINESS',
        data: {
          screen_banner: images.banner_add_business || '',
          has_screen_banner: !!images.banner_add_business,
        },
      };
    }

    if (sel === 'my_business') {
      // Fetch business directly — no radio screen needed
      const doc = phone
        ? await Business.findOne({ ownerPhone: phone }).sort({ createdAt: -1 }).lean()
        : null;

      if (!doc) {
        return {
          screen: 'INFO',
          data: {
            info_title: 'No Business Found',
            info_body: 'We could not find a registered business for your number.\n\nChoose *Add Your Business* to get listed on Vanigan! 🏪',
          },
        };
      }

      // Store the business ID in pendingAction so the webhook nfm_reply can send the CTA
      if (phone) {
        await User.findOneAndUpdate(
          { phone },
          { $set: { pendingAction: `my_business:${doc._id.toString()}` } },
          { upsert: true }
        ).catch(() => {});
      }

      // Close the flow — nfm_reply webhook will send the CTA message
      return {
        screen: 'INFO',
        data: {
          info_title: doc.name,
          info_body: `Your business details are being sent to you on WhatsApp now.\n\nTap the link in the message to view, edit, or manage your listing. 🏪`,
        },
      };
    }

    if (['business', 'organizer', 'member'].includes(sel)) {
      const bannerKey = kindBannerKey(sel);
      return {
        screen: 'SELECT_DISTRICT',
        data: {
          screen_banner: images[bannerKey] || '',
          has_screen_banner: !!images[bannerKey],
          screen_heading: `${kindLabel(sel, true)} — Select District`,
          kind: sel,
          districts: buildDistrictOptions(),
        },
      };
    }

    // Unknown selection — restart
    return handleInit(flow_token);
  }

  // ─── SELECT_DISTRICT → SELECT_ASSEMBLY ───
  if (screen === 'SELECT_DISTRICT') {
    const kind = data?.kind || 'business';
    // FIX 2.3: Validate district against allowlist before querying DB
    const rawDistrict = String(data?.district || '').trim();
    const validDistricts = districts.getDistricts();
    const district = validDistricts.includes(rawDistrict) ? rawDistrict : '';
    if (!district) {
      return { screen: 'INFO', data: { info_title: 'Invalid selection', info_body: 'Please go back and select a valid district.' } };
    }
    const bannerKey = kindBannerKey(kind);
    const assemblies = buildAssemblyOptions(district);

    if (!assemblies.length) {
      return {
        screen: 'INFO',
        data: {
          info_title: 'No assemblies found',
          info_body: `We could not find assemblies for ${district}. Please type *hi* and try again.`,
        },
      };
    }

    // Cache last district on the user for convenience
    if (phone) {
      await User.findOneAndUpdate(
        { phone },
        { $set: { lastDistrict: district } },
        { upsert: true }
      ).catch(() => {});
    }

    return {
      screen: 'SELECT_ASSEMBLY',
      data: {
        screen_banner: images[bannerKey] || '',
        has_screen_banner: !!images[bannerKey],
        screen_heading: `${district} — Select Assembly`,
        kind,
        district,
        assemblies,
      },
    };
  }

  // ─── SELECT_ASSEMBLY → SELECT_CATEGORY (business) or ITEM_LIST (others) ───
  if (screen === 'SELECT_ASSEMBLY') {
    const kind = data?.kind || 'business';
    // FIX 2.3: Validate district and assembly against allowlists
    const rawDistrict = String(data?.district || '').trim();
    const rawAssembly = String(data?.assembly || '').trim();
    const validDistricts = districts.getDistricts();
    const district = validDistricts.includes(rawDistrict) ? rawDistrict : '';
    if (!district) {
      return { screen: 'INFO', data: { info_title: 'Invalid selection', info_body: 'Please go back and select a valid district.' } };
    }
    const validAssemblies = districts.getAssemblies(district);
    const assembly = validAssemblies.includes(rawAssembly) ? rawAssembly : '';
    if (!assembly) {
      return { screen: 'INFO', data: { info_title: 'Invalid selection', info_body: 'Please go back and select a valid assembly.' } };
    }
    const bannerKey = kindBannerKey(kind);

    if (phone) {
      await User.findOneAndUpdate(
        { phone },
        { $set: { lastDistrict: district, lastAssembly: assembly } },
        { upsert: true }
      ).catch(() => {});
    }

    // Business kind → show category selector before sending CTA link
    if (kind === 'business') {
      const catImgDocs = await CategoryImage.find({ category: { $in: CATEGORIES } }).lean().catch(() => []);
      const catImgMap  = {};
      catImgDocs.forEach((d) => { catImgMap[d.category] = d.imageUrl || ''; });

      /* WhatsApp Flows requires raw base64 for data-source images, not URLs.
         Convert each category thumbnail in parallel (80×80, quality 55) to
         keep the total response well under the ~250 KB cap. */
      const base64Map = {};
      await Promise.all(
        CATEGORIES
          .filter((c) => catImgMap[c])
          .map(async (c) => {
            base64Map[c] = await urlToBase64(catImgMap[c], {
              width: 80, height: 80, crop: 'fill', quality: 55, format: 'jpg',
            });
          })
      );

      const catOptions = CATEGORIES.map((c) => ({
        id:    c,
        title: c,
        ...(base64Map[c] ? { image: base64Map[c] } : {}),
      }));
      return {
        screen: 'SELECT_CATEGORY',
        data: {
          screen_banner: images[bannerKey] || '',
          has_screen_banner: !!images[bannerKey],
          screen_heading: `${assembly} — Select Category`,
          kind,
          district,
          assembly,
          categories: catOptions,
        },
      };
    }

    // Organizer / Member → existing list flow
    const items = await buildItemList(kind, district, assembly);
    if (!items.length) {
      return {
        screen: 'INFO',
        data: {
          info_title: `No ${kindLabel(kind, true).toLowerCase()} listed yet`,
          info_body:
            `We do not have any ${kindLabel(kind, true).toLowerCase()} listed in ${assembly}, ${district} yet. ` +
            `Please check back soon. \uD83E\uDD54`,
        },
      };
    }
    return {
      screen: 'ITEM_LIST',
      data: {
        screen_banner: images[bannerKey] || '',
        has_screen_banner: !!images[bannerKey],
        screen_heading: `${kindLabel(kind, true)} in ${assembly}, ${district}`,
        kind,
        district,
        assembly,
        items,
      },
    };
  }

  // ─── SELECT_CATEGORY → SELECT_SUBCATEGORY ───
  if (screen === 'SELECT_CATEGORY') {
    const kind     = data?.kind     || 'business';
    const district = data?.district || '';
    const assembly = data?.assembly || '';
    const category = data?.selected_category || '';
    const bannerKey = kindBannerKey(kind);

    if (!category) {
      return { screen: 'INFO', data: { info_title: 'No category selected', info_body: 'Please go back and select a category.' } };
    }

    const subCats   = SUB_CATEGORIES[category] || [];
    const subOptions = [
      { id: 'All', title: '\uD83D\uDD0D All Sub-Categories' },
      ...subCats.map((s) => ({ id: s, title: s })),
    ];

    return {
      screen: 'SELECT_SUBCATEGORY',
      data: {
        screen_banner:     images[bannerKey] || '',
        has_screen_banner: !!images[bannerKey],
        screen_heading:    `${category} \u2014 Sub-Category`,
        kind,
        district,
        assembly,
        category,
        subcategories: subOptions,
      },
    };
  }

  // ─── MY_BUSINESS_LIST → send rich CTA message then close flow ───
  if (screen === 'MY_BUSINESS_LIST') {
    const kind = 'business';
    const itemId = data?.selected_item;
    if (!itemId) {
      return { screen: 'INFO', data: { info_title: 'Not found', info_body: 'Please try again.' } };
    }
    let doc = null;
    try { doc = await Business.findById(itemId).lean(); } catch { doc = null; }
    if (!doc) {
      return { screen: 'INFO', data: { info_title: 'Not available', info_body: 'This listing is no longer available.' } };
    }

    // Build the public dir URL with edit/delete access (phone in query for owner recognition)
    const backend = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
    const bizUrl = `${backend}/public/dir/${itemId}?phone=${encodeURIComponent(phone)}`;

    // Build a rich body text with key business details
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

    const bodyText = lines.join('\n');

    // Send async — don't wait so flow closes fast
    setImmediate(async () => {
      try {
        await meta.sendCtaUrlMessage(phone, {
          headerImageUrl: doc.coverImage || doc.image || undefined,
          bodyText,
          footerText: 'Vanigan Directory',
          buttonText: 'Manage My Business',
          url: bizUrl,
        });
      } catch (err) {
        console.error('[flowEndpoint] my_business CTA send failed:', err.message);
      }
    });

    // Close the flow immediately
    return {
      screen: 'INFO',
      data: {
        info_title: `${doc.name}`,
        info_body: `Your business details are being sent to you on WhatsApp now.\n\nTap the link in the message to view, edit, or manage your listing. 🏪`,
      },
    };
  }

  // ─── ITEM_LIST → ITEM_DETAILS ───
  if (screen === 'ITEM_LIST') {
    const kind = data?.kind || 'business';
    const itemId = data?.selected_item;
    const M = await modelFor(kind);
    if (!M || !itemId) {
      return { screen: 'INFO', data: { info_title: 'Not found', info_body: 'Please try again.' } };
    }

    let doc = null;
    try {
      doc = await M.findById(itemId).lean();
    } catch {
      doc = null;
    }
    // Fall back to seed DB for business listings
    if (!doc && kind === 'business') {
      doc = await findSeedBusinessById(itemId).catch(() => null);
    }
    // Fall back to seed DB for organizer listings
    if (!doc && kind === 'organizer') {
      doc = await findSeedOrganizerById(itemId).catch(() => null);
    }
    if (!doc) {
      return { screen: 'INFO', data: { info_title: 'Not available', info_body: 'This listing is no longer available.' } };
    }

    let imgB64 = '';
    if (doc.image) {
      imgB64 = await urlToBase64(doc.image, {
        width: 1000,
        height: 600,
        crop: 'fill',
        quality: 75,
        format: 'jpg',
      });
    }

    const subtitle = [doc.assembly, doc.district].filter(Boolean).join(', ');
    const extra = [
      doc.category && `Category: ${doc.category}`,
      doc.role && `Role: ${doc.role}`,
      doc.designation && `Designation: ${doc.designation}`,
      doc.address && `Address: ${doc.address}`,
      doc.phone && `Phone: ${doc.phone}`,
      doc.email && `Email: ${doc.email}`,
    ].filter(Boolean).join('\n');

    const description = [doc.description, extra].filter(Boolean).join('\n\n');
    const { meta: revMeta, recent } = await reviewSummary(kind, itemId);

    return {
      screen: 'ITEM_DETAILS',
      data: {
        item_image: imgB64,
        has_item_image: !!imgB64,
        item_title: doc.name || kindLabel(kind),
        item_subtitle: subtitle,
        item_description: description || ' ',
        item_meta: revMeta,
        recent_reviews: recent,
        kind,
        item_id: itemId,
      },
    };
  }

  // ─── ITEM_DETAILS → REVIEW ───
  if (screen === 'ITEM_DETAILS') {
    const kind = data?.kind || 'business';
    const itemId = data?.item_id;
    const user = phone ? await User.findOne({ phone }).lean() : null;
    const M = await modelFor(kind);
    let doc = null;
    if (M && itemId) {
      try { doc = await M.findById(itemId).lean(); } catch {}
    }
    // Fall back to seed DB for business
    if (!doc && kind === 'business' && itemId) {
      doc = await findSeedBusinessById(itemId).catch(() => null);
    }
    // Fall back to seed DB for organizer
    if (!doc && kind === 'organizer' && itemId) {
      doc = await findSeedOrganizerById(itemId).catch(() => null);
    }

    return {
      screen: 'REVIEW',
      data: {
        screen_banner: images.banner_review || '',
        has_screen_banner: !!images.banner_review,
        screen_heading: doc?.name ? `Rate ${doc.name}` : 'Add Your Review',
        kind,
        item_id: itemId || '',
        init_name: user?.name || user?.profileName || '',
        rating_options: ratingOptions(),
      },
    };
  }

  // ─── REVIEW submitted ───
  if (screen === 'REVIEW') {
    const kind = data?.kind || 'business';
    const itemId = data?.item_id;
    const ratingNum = parseInt(data?.rating, 10);
    const text = (data?.review_text || '').trim().substring(0, 1000); // cap length
    const reviewerName = (data?.reviewer_name || '').trim().substring(0, 100);
    const M = await modelFor(kind);

    if (!M || !itemId || !ratingNum || ratingNum < 1 || ratingNum > 5 || !reviewerName) {
      return {
        screen: 'INFO',
        data: { info_title: 'Missing details', info_body: 'Please fill in name, rating and review text.' },
      };
    }

    // FIX 12.1: Verify the listing still exists before creating a review
    try {
      let listingExists = false;
      try {
        const existsCheck = await M.exists({ _id: itemId });
        listingExists = !!existsCheck;
      } catch { listingExists = false; }

      // Fall back to seed DBs for business/organizer
      if (!listingExists && kind === 'business') {
        const seedDoc = await findSeedBusinessById(itemId).catch(() => null);
        listingExists = !!seedDoc;
      }
      if (!listingExists && kind === 'organizer') {
        const seedDoc = await findSeedOrganizerById(itemId).catch(() => null);
        listingExists = !!seedDoc;
      }

      if (!listingExists) {
        return {
          screen: 'INFO',
          data: { info_title: 'Listing not found', info_body: 'This listing was removed. Type *hi* to browse other listings.' },
        };
      }

      await Review.create({
        targetKind: kind,
        targetId: itemId,
        rating: ratingNum,
        text,
        phone,
        reviewerName,
      });
      // Persist the name on the User for next time.
      if (phone) {
        await User.findOneAndUpdate(
          { phone },
          { $set: { name: reviewerName } },
          { upsert: true }
        ).catch(() => {});
      }
    } catch (err) {
      console.error('[FlowEndpoint] review save failed:', err.message);
    }

    return {
      screen: 'INFO',
      data: {
        info_title: '🙏 Thanks for your review!',
        info_body: `Your ${ratingNum}-star review has been recorded. Type *hi* anytime to explore more listings.`,
      },
    };
  }

  // ─── PLANS selection ───
  if (screen === 'PLANS') {
    const code = data?.selected_plan;
    const plan = await Plan.findOne({ code, active: true }).lean();
    const user = phone ? await User.findOne({ phone }).lean() : null;
    const current = user?.currentPlan || 'free';

    if (!plan) {
      return {
        screen: 'INFO',
        data: { info_title: 'Plan unavailable', info_body: 'That plan is no longer available.' },
      };
    }

    if (code === current) {
      return {
        screen: 'INFO',
        data: {
          info_title: `${plan.name} — Your Current Plan`,
          info_body: `You are already on the *${plan.name}* plan. Type *hi* to explore listings.`,
        },
      };
    }

    if (code === 'free') {
      return {
        screen: 'INFO',
        data: {
          info_title: `${plan.name}`,
          info_body: `${plan.priceLabel || ''}\n\n${plan.description || 'Our free tier — enjoy unlimited browsing.'}`,
        },
      };
    }

    // Premium / Premium Plus — invite the user; our team follows up.
    const feats = (plan.features || []).map((f) => `• ${f}`).join('\n');
    return {
      screen: 'INFO',
      data: {
        info_title: `Upgrade to ${plan.name}`,
        info_body:
          `${plan.priceLabel || ''}\n\n${plan.description || ''}\n\n${feats}\n\n` +
          `Our team will contact you on WhatsApp to complete the upgrade. 🙏`,
      },
    };
  }

  // ─── EPIC_LOOKUP → look up voter DB, return VOTER_CONFIRM ───
  if (screen === 'EPIC_LOOKUP') {
    const epicNo = String(data?.epic_no || '').toUpperCase().trim();
    if (!epicNo) {
      return { screen: 'INFO', data: { info_title: 'EPIC Required', info_body: 'Please enter a valid Voter ID number.' } };
    }

    // Check if already a member
    const VM = await getMemberModel();
    const existingMember = await VM.findOne({ phone }).select('_id').lean().catch(() => null);
    if (existingMember) {
      if (phone) await User.findOneAndUpdate({ phone }, { $set: { pendingAction: 'my_card' } }, { upsert: true }).catch(() => {});
      return { screen: 'INFO', data: { info_title: '✅ Already a Member', info_body: 'You are already a Vanigan member! Your membership card will be sent to you on WhatsApp.' } };
    }

    // Look up voter DB
    const { findByEpicNo } = require('../services/voterDb');
    const voter = await findByEpicNo(epicNo).catch(() => null);

    if (!voter) {
      return {
        screen: 'INFO',
        data: {
          info_title: '❌ Voter ID Not Found',
          info_body: `We could not find EPIC number *${epicNo}* in the voter database.\n\nPlease check your Voter ID card and try again. Type *hi* to restart.`,
        },
      };
    }

    const bannerUrl = images.flow_welcome_banner || '';
    // Plain text summary — no emoji, no markdown — safe for Flow TextBody (512 char limit)
    const summary = [
      `Name: ${voter.name}`,
      `EPIC: ${voter.epic_no}`,
      `Assembly: ${voter.assembly_name} (No. ${voter.assembly_no})`,
      `District: ${voter.district}`,
      `Gender: ${voter.gender || 'Not specified'}`,
      voter.mobile ? `Mobile: ${voter.mobile}` : null,
    ].filter(Boolean).join('\n');

    const zone = voter.zone || getZoneByDistrict(voter.district) || '';

    return {
      screen: 'VOTER_CONFIRM',
      data: {
        screen_banner:     bannerUrl,
        has_screen_banner: !!bannerUrl,
        voter_summary:     summary.substring(0, 500),
        epic_no:           String(voter.epic_no   || ''),
        voter_name:        String(voter.name       || ''),
        voter_district:    String(voter.district   || ''),
        voter_assembly:    String(voter.assembly_name || ''),
        voter_assembly_no: String(voter.assembly_no  || ''),
        voter_gender:      String(voter.gender     || ''),
        voter_zone:        String(zone),
      },
    };
  }

  // ─── VOTER_CONFIRM → MEMBER_DETAILS ───
  if (screen === 'VOTER_CONFIRM') {
    // Accept both 'confirm_voter' action and any data_exchange from VOTER_CONFIRM screen
    const bannerUrl = images.flow_welcome_banner || '';
    const zone = String(data?.voter_zone || '') || getZoneByDistrict(String(data?.voter_district || ''));
    return {
      screen: 'MEMBER_DETAILS',
      data: {
        screen_banner:     bannerUrl,
        has_screen_banner: !!bannerUrl,
        epic_no:           String(data?.epic_no           || ''),
        voter_name:        String(data?.voter_name        || ''),
        voter_district:    String(data?.voter_district    || ''),
        voter_assembly:    String(data?.voter_assembly    || ''),
        voter_assembly_no: String(data?.voter_assembly_no || ''),
        voter_gender:      String(data?.voter_gender      || ''),
        voter_zone:        String(zone),
        blood_group_options: [
          { id: 'A+', title: 'A+' }, { id: 'A-', title: 'A-' },
          { id: 'B+', title: 'B+' }, { id: 'B-', title: 'B-' },
          { id: 'O+', title: 'O+' }, { id: 'O-', title: 'O-' },
          { id: 'AB+', title: 'AB+' }, { id: 'AB-', title: 'AB-' },
        ],
      },
    };
  }

  // Fallback — return to main menu
  return {
    screen: 'INFO',
    data: { info_title: 'Vanakkam 🙏', info_body: 'Type *hi* to open the menu again.' },
  };
}

module.exports = router;
module.exports.clearImageCache = clearImageCache;
