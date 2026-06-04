const mongoose = require('mongoose');

/**
 * Vanigan website user — signs up with WhatsApp number + 4-digit PIN.
 * Stores basic profile info collected at signup. If they own a business,
 * businessId links to the Business document.
 */
const VaniganUserSchema = new mongoose.Schema(
  {
    phone:       { type: String, required: true, unique: true, trim: true, index: true },
    name:        { type: String, default: '', trim: true },
    pinHash:     { type: String, required: true },   // bcrypt hash of 4-digit PIN
    district:    { type: String, default: '', trim: true },
    assembly:    { type: String, default: '', trim: true },
    businessId:  { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VaniganUser', VaniganUserSchema);
