const mongoose = require('mongoose');

/**
 * WhatsApp contact who has interacted with the bot.
 * `currentPlan` defaults to 'free' and is bumped when the admin grants a
 * premium subscription (manual for now).
 */
const UserSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: '', trim: true },
    profileName: { type: String, default: '' },
    currentPlan: { type: String, enum: ['free', 'premium', 'premium_plus'], default: 'free' },
    lastDistrict: { type: String, default: '' },
    lastAssembly: { type: String, default: '' },
    pendingAction: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
