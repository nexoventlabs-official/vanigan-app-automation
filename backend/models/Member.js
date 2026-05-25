const mongoose = require('mongoose');

/**
 * A registered Vanigan member (people, not organizations).
 */
const MemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    designation: { type: String, default: '', trim: true },
    district: { type: String, required: true, trim: true, index: true },
    assembly: { type: String, required: true, trim: true, index: true },
    phone: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    image: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MemberSchema.index({ district: 1, assembly: 1, active: 1 });

module.exports = mongoose.model('Member', MemberSchema);
