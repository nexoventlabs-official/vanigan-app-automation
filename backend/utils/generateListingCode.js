const Business = require('../models/Business');

/**
 * Auto-generates a unique listing code that matches the format of existing codes.
 * Pattern: <PREFIX><NUMBER> e.g. LIST24155 → LIST24156
 * Falls back to LIST10001 if no codes exist yet.
 */
async function generateListingCode() {
  const codes = await Business.find(
    { listingCode: { $exists: true, $ne: '' } },
    { listingCode: 1 }
  ).lean().catch(() => []);

  let maxNum = 0;
  let prefix = '';
  let padLen  = 5;

  for (const b of codes) {
    const m = (b.listingCode || '').match(/^([A-Za-z\-\/]*)([0-9]+)$/);
    if (m) {
      const num = parseInt(m[2], 10);
      if (num > maxNum) {
        maxNum  = num;
        prefix  = m[1];
        padLen  = Math.max(padLen, m[2].length);
      }
    }
  }

  if (maxNum === 0) { prefix = 'LIST'; maxNum = 10000; padLen = 5; }

  for (let attempt = 0; attempt < 20; attempt++) {
    maxNum++;
    const candidate = prefix + String(maxNum).padStart(padLen, '0');
    const clash = await Business.findOne({ listingCode: candidate }).lean().catch(() => null);
    if (!clash) return candidate;
  }
  return (prefix || 'LIST') + String(Date.now()).slice(-5);
}

module.exports = generateListingCode;
