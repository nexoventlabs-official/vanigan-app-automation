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
const Organizer = require('../models/Organizer');
const Member = require('../models/Member');
const Plan = require('../models/Plan');
const Review = require('../models/Review');

const router = express.Router();

const LOG_PATH = path.join(__dirname, '..', 'flow-debug.log');
function dbg(...args) {
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

const FLOW_PRIVATE_KEY_RAW = process.env.FLOW_PRIVATE_KEY || '';
const FLOW_PRIVATE_KEY = FLOW_PRIVATE_KEY_RAW.split('\\n').join('\n');

function decryptRequest(body) {
  const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body || {};

  if (!FLOW_PRIVATE_KEY) {
    // Development fallback: accept plain JSON
    return { decryptedBody: body, aesKeyBuffer: null, ivBuffer: null };
  }
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

  const decipher = crypto.createDecipheriv('aes-128-gcm', aesKeyBuffer, ivBuffer);
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

  const cipher = crypto.createCipheriv('aes-128-gcm', aesKeyBuffer, flipped);
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
  return String(token).replace(/^welcome_/, '').replace(/\D/g, '');
}

function modelFor(kind) {
  if (kind === 'business') return Business;
  if (kind === 'organizer') return Organizer;
  if (kind === 'member') return Member;
  return null;
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

async function buildServiceList(images) {
  const list = [
    withImage(
      { id: 'business', title: 'Business List', description: 'Local businesses by district' },
      images.icon_business_list
    ),
    withImage(
      { id: 'organizer', title: 'Organizer List', description: 'Community organizers' },
      images.icon_organizer_list
    ),
    withImage(
      { id: 'member', title: 'Members List', description: 'Vanigan members directory' },
      images.icon_member_list
    ),
    withImage(
      { id: 'add_business', title: 'Add Your Business', description: 'Register your business' },
      images.icon_add_business
    ),
    withImage(
      { id: 'my_business', title: 'My Business', description: 'View your listings' },
      images.icon_my_business
    ),
  ];
  return list;
}

function buildDistrictOptions() {
  return districts.getDistricts().map((d) => ({ id: d, title: d }));
}

function buildAssemblyOptions(district) {
  return districts.getAssemblies(district).map((a) => ({ id: a, title: a }));
}

async function buildItemList(kind, district, assembly) {
  const M = modelFor(kind);
  if (!M) return [];
  const items = await M.find({ district, assembly, active: true }).sort({ name: 1 }).limit(20).lean();

  return Promise.all(
    items.map(async (it) => {
      const item = {
        id: it._id.toString(),
        title: (it.name || kindLabel(kind)).substring(0, 30),
        description: (it.description || it.category || it.role || it.designation || '').substring(0, 60),
      };
      if (it.image) {
        const b64 = await urlToBase64(it.image, {
          width: 200,
          height: 200,
          crop: 'fill',
          quality: 75,
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
    dbg('HANDLER_ERROR', { message: err.message, stack: err.stack });
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
  const images = await loadImagesB64();
  const services = await buildServiceList(images);

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

    if (sel === 'add_business') {
      // Save pendingAction — webhook will send the CTA after the nfm_reply arrives
      if (phone) {
        await User.findOneAndUpdate(
          { phone },
          { $set: { pendingAction: 'add_business' } },
          { upsert: true }
        ).catch(() => {});
      }
      return {
        screen: 'INFO',
        data: {
          info_title: '🏪 Add Your Business',
          info_body: 'Tap *Close* — we\'ll send you the registration link right away!',
        },
      };
    }

    if (sel === 'my_business') {
      const myBusinesses = phone
        ? await Business.find({ ownerPhone: phone, active: true }).sort({ name: 1 }).limit(20).lean()
        : [];

      if (!myBusinesses.length) {
        return {
          screen: 'INFO',
          data: {
            info_title: 'No Businesses Found',
            info_body: 'You have not registered any active businesses yet.\n\nChoose *Add Your Business* to get started! 🏪',
          },
        };
      }

      const myItems = await Promise.all(
        myBusinesses.map(async (b) => {
          const item = {
            id: b._id.toString(),
            title: (b.name || 'Business').substring(0, 30),
            description: (b.category || b.description || '').substring(0, 60),
          };
          if (b.image) {
            const b64 = await urlToBase64(b.image, { width: 200, height: 200, crop: 'fill', quality: 75, format: 'jpg' });
            if (b64) item.image = b64;
          }
          return item;
        })
      );

      return {
        screen: 'MY_BUSINESS_LIST',
        data: {
          screen_banner: images.banner_business || '',
          has_screen_banner: !!images.banner_business,
          screen_heading: 'My Businesses',
          kind: 'business',
          district: '',
          assembly: '',
          items: myItems,
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
    const district = data?.district || '';
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
    const district = data?.district || '';
    const assembly = data?.assembly || '';
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
      const catOptions = [
        { id: 'All', title: '\uD83D\uDD0D All Categories' },
        ...CATEGORIES.map((c) => ({ id: c, title: c })),
      ];
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

  // ─── SELECT_CATEGORY → send CTA URL message + close flow ───
  if (screen === 'SELECT_CATEGORY') {
    const kind     = data?.kind || 'business';
    const district = data?.district || '';
    const assembly = data?.assembly || '';
    const category = data?.selected_category || 'All';

    const backendUrl = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
    const params = new URLSearchParams({ district, assembly });
    if (category && category !== 'All') params.set('category', category);
    const dirUrl = `${backendUrl}/public/dir?${params.toString()}`;

    if (phone) {
      const catLabel2 = (category && category !== 'All') ? category : 'All Categories';
      const bodyText =
        `\uD83C\uDFEA *Businesses in ${assembly}, ${district}*\n` +
        `Category: *${catLabel2}*\n\n` +
        `Tap the button below to browse the full listing with details and reviews.`;

      // Fetch original banner URL (not base64) for the CTA image header
      const bannerMap = await flowImages.getMap(['banner_business']);
      const bannerUrl = bannerMap['banner_business'] || '';

      meta.sendCtaUrlMessage(phone, {
        headerImageUrl: bannerUrl || undefined,
        bodyText,
        footerText: 'Powered by Vanigan \uD83E\uDD54',
        buttonText: '\uD83C\uDFEA View Businesses',
        url: dirUrl,
      }).catch(() => {});
    }

    return {
      screen: 'INFO',
      data: {
        info_title: '\uD83C\uDFEA Business Directory',
        info_body: `Tap *Close* \u2014 we\'re sending you the business list link for *${assembly}* right now! \uD83D\uDE4F`,
      },
    };
  }

  // ─── MY_BUSINESS_LIST → ITEM_DETAILS (same logic as ITEM_LIST) ───
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
    let imgB64 = '';
    if (doc.image) {
      imgB64 = await urlToBase64(doc.image, { width: 1000, height: 600, crop: 'fill', quality: 75, format: 'jpg' });
    }
    const subtitle = [doc.assembly, doc.district].filter(Boolean).join(', ');
    const lines = [];
    if (doc.description) { lines.push(doc.description); lines.push(''); }
    const cat = [doc.category, doc.subCategory].filter(Boolean).join(' › ');
    if (cat) lines.push(`🏷️ ${cat}`);
    if (doc.address) lines.push(`📍 ${doc.address}`);
    if (doc.landmark) lines.push(`   📌 ${doc.landmark}`);
    if (doc.city || doc.pincode) lines.push(`   ${[doc.city, doc.pincode].filter(Boolean).join(' – ')}`);
    if (doc.serviceLocations) lines.push(`🗺️ Serves: ${doc.serviceLocations}`);
    if (doc.phone) lines.push(`📞 ${doc.phone}`);
    if (doc.whatsappNo) lines.push(`💬 WA: ${doc.whatsappNo}`);
    if (doc.landline) lines.push(`☎️ ${doc.landline}`);
    if (doc.phone2) lines.push(`📱 Alt: ${doc.phone2}`);
    if (doc.email) lines.push(`✉️ ${doc.email}`);
    if (doc.website) lines.push(`🌐 ${doc.website}`);
    if (doc.fbLink) lines.push(`📘 FB: ${doc.fbLink}`);
    if (doc.googleMap) lines.push(`🗺️ Maps: ${doc.googleMap}`);
    if (doc.openDays || doc.openTime || doc.closeTime) {
      const timeStr = [doc.openTime, doc.closeTime].filter(Boolean).join(' – ');
      lines.push(`🕐 ${[doc.openDays, timeStr].filter(Boolean).join('  |  ')}`);
    }
    const validSvcs = (doc.services || []).filter(s => s.name);
    if (validSvcs.length) {
      lines.push(''); lines.push('🛍️ Services:');
      validSvcs.forEach(s => {
        const pr = s.price ? ` — ₹${s.price}` : '';
        lines.push(`  • ${s.name}${pr}`);
        if (s.detail) lines.push(`    ${s.detail}`);
      });
    }
    if (doc.infoQuestion) {
      lines.push('');
      lines.push(`❓ ${doc.infoQuestion}`);
      if (doc.infoAnswer) lines.push(`   ${doc.infoAnswer}`);
    }
    const description = lines.join('\n').trim();
    const { meta: revMetaMb, recent: recentMb } = await reviewSummary(kind, itemId);
    return {
      screen: 'ITEM_DETAILS',
      data: {
        item_image: imgB64,
        has_item_image: !!imgB64,
        item_title: doc.name || 'Business',
        item_subtitle: subtitle,
        item_description: description || ' ',
        item_meta: revMetaMb,
        recent_reviews: recentMb,
        kind,
        item_id: itemId,
      },
    };
  }

  // ─── ITEM_LIST → ITEM_DETAILS ───
  if (screen === 'ITEM_LIST') {
    const kind = data?.kind || 'business';
    const itemId = data?.selected_item;
    const M = modelFor(kind);
    if (!M || !itemId) {
      return { screen: 'INFO', data: { info_title: 'Not found', info_body: 'Please try again.' } };
    }

    let doc = null;
    try {
      doc = await M.findById(itemId).lean();
    } catch {
      doc = null;
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
    const M = modelFor(kind);
    let doc = null;
    if (M && itemId) {
      try { doc = await M.findById(itemId).lean(); } catch {}
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
    const text = (data?.review_text || '').trim();
    const reviewerName = (data?.reviewer_name || '').trim();
    const M = modelFor(kind);

    if (!M || !itemId || !ratingNum || !reviewerName) {
      return {
        screen: 'INFO',
        data: { info_title: 'Missing details', info_body: 'Please fill in name, rating and review text.' },
      };
    }

    try {
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

  // Fallback
  return {
    screen: 'INFO',
    data: { info_title: 'Vanakkam 🙏', info_body: 'Type *hi* to open the menu again.' },
  };
}

module.exports = router;
module.exports.clearImageCache = clearImageCache;
