const FlowImage = require('../models/FlowImage');

/**
 * Catalog of every image key the WhatsApp flow / chatbot expects.
 * The admin panel pulls this list and lets the user upload an image
 * for each key.
 */
const IMAGE_KEYS = [
  // Plan-specific chatbot welcome message headers (shown BEFORE user taps "Choose Service")
  { key: 'chat_welcome_header_free', label: 'Welcome header — Free plan users', group: 'welcome_headers' },
  { key: 'chat_welcome_header_premium', label: 'Welcome header — Premium plan users', group: 'welcome_headers' },
  { key: 'chat_welcome_header_premium_plus', label: 'Welcome header — Premium Plus plan users', group: 'welcome_headers' },
  // Legacy fallback (used if no plan-specific image is set)
  { key: 'chat_welcome_header', label: 'Welcome header — Fallback (all plans)', group: 'welcome_headers' },

  // Top banner inside the first flow screen
  { key: 'flow_welcome_banner', label: 'Welcome Flow Banner (top of service screen)', group: 'banners' },

  // Service tile icons
  { key: 'icon_business_list', label: 'Service icon: Business List', group: 'service_icons' },
  { key: 'icon_organizer_list', label: 'Service icon: Organizer List', group: 'service_icons' },
  { key: 'icon_member_list', label: 'Service icon: Members List', group: 'service_icons' },
  { key: 'icon_add_business', label: 'Service icon: Add Your Business', group: 'service_icons' },
  { key: 'icon_my_business', label: 'Service icon: My Business', group: 'service_icons' },

  // Sub-screen banners
  { key: 'banner_business', label: 'Banner — Business district / list screens', group: 'sub_banners' },
  { key: 'banner_organizer', label: 'Banner — Organizer district / list screens', group: 'sub_banners' },
  { key: 'banner_member', label: 'Banner — Member district / list screens', group: 'sub_banners' },
  { key: 'banner_add_business', label: 'Banner — Add Business CTA message header', group: 'sub_banners' },
  { key: 'banner_review', label: 'Banner — Review submission screen', group: 'sub_banners' },

  // Plan tile icons (fallbacks if a Plan record has no image)
  { key: 'icon_plan_free', label: 'Plan icon: Free', group: 'plan_icons' },
  { key: 'icon_plan_premium', label: 'Plan icon: Premium', group: 'plan_icons' },
  { key: 'icon_plan_premium_plus', label: 'Plan icon: Premium Plus', group: 'plan_icons' },
];

async function ensureKeysExist() {
  for (const item of IMAGE_KEYS) {
    await FlowImage.updateOne(
      { key: item.key },
      { $setOnInsert: { key: item.key, label: item.label, url: '', publicId: '' } },
      { upsert: true }
    );
  }
}

async function getUrl(key) {
  const doc = await FlowImage.findOne({ key }).lean();
  return doc?.url || '';
}

async function getMap(keys) {
  const docs = await FlowImage.find({ key: { $in: keys } }).lean();
  const out = {};
  keys.forEach((k) => (out[k] = ''));
  docs.forEach((d) => {
    out[d.key] = d.url || '';
  });
  return out;
}

module.exports = { IMAGE_KEYS, ensureKeysExist, getUrl, getMap };
