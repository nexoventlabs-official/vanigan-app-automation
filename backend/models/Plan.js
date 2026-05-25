const mongoose = require('mongoose');

/**
 * Subscription plan shown to WhatsApp users.
 * `code` matches User.currentPlan ('free' | 'premium' | 'premium_plus').
 */
const PlanSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, enum: ['free', 'premium', 'premium_plus'] },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    priceLabel: { type: String, default: '', trim: true }, // e.g. "₹0 / month"
    features: [{ type: String }],
    image: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', PlanSchema);
