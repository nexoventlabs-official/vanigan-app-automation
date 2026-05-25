/**
 * Insert / refresh the three default subscription plans.
 * Server.js already seeds them on first boot — this script lets you reset
 * them manually after edits.
 *
 * Usage: npm run seed:plans
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Plan = require('../models/Plan');

const DEFAULTS = [
  {
    code: 'free',
    name: 'Free',
    priceLabel: '₹0 / month',
    description: 'Browse the full directory at no cost.',
    sortOrder: 0,
    features: ['Browse businesses', 'Browse organizers', 'Browse members'],
    active: true,
  },
  {
    code: 'premium',
    name: 'Premium',
    priceLabel: '₹99 / month',
    description: 'Priority placement & WhatsApp alerts.',
    sortOrder: 1,
    features: ['Priority placement', 'Monthly newsletter', 'Featured badge'],
    active: true,
  },
  {
    code: 'premium_plus',
    name: 'Premium Plus',
    priceLabel: '₹199 / month',
    description: 'Everything in Premium + analytics & dedicated support.',
    sortOrder: 2,
    features: ['Everything in Premium', 'Listing analytics', 'Dedicated support'],
    active: true,
  },
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  for (const p of DEFAULTS) {
    await Plan.findOneAndUpdate({ code: p.code }, { $set: p }, { upsert: true, new: true });
    console.log('✅ plan upserted:', p.code);
  }
  await mongoose.disconnect();
})();
