const mongoose = require('mongoose');

/**
 * A business listed in the directory. Shown to WhatsApp users after they
 * pick District + Assembly inside the flow.
 */
const BusinessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    category: { type: String, default: '', trim: true },
    district: { type: String, required: true, trim: true, index: true },
    assembly: { type: String, required: true, trim: true, index: true },
    address: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    image: { type: String, default: '' }, // Cloudinary URL
    imagePublicId: { type: String, default: '' },
    ownerPhone: { type: String, default: '', trim: true, index: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

BusinessSchema.index({ district: 1, assembly: 1, active: 1 });

module.exports = mongoose.model('Business', BusinessSchema);
