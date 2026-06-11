/**
 * generateMembershipId.js
 * Generate sequential membership IDs like TNV-001234.
 * Uses VaniganMember collection to find the last ID.
 */
const VaniganMember = require('../models/VaniganMember');

async function generateMembershipId() {
  // Find the highest existing membershipId
  const last = await VaniganMember.findOne(
    { membershipId: { $regex: /^TNV-\d+$/ } },
    { membershipId: 1 }
  ).sort({ createdAt: -1 }).lean();

  let nextNum = 1;
  if (last?.membershipId) {
    const num = parseInt(last.membershipId.replace('TNV-', ''), 10);
    if (!isNaN(num)) nextNum = num + 1;
  }

  return `TNV-${String(nextNum).padStart(6, '0')}`;
}

module.exports = generateMembershipId;
