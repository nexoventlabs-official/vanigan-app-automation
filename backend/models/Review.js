const mongoose = require('mongoose');

/**
 * A review/rating posted by a WhatsApp user against a Business, Organizer
 * or Member. `targetKind` discriminates which collection `targetId` points to.
 */
const ReviewSchema = new mongoose.Schema(
  {
    targetKind: { type: String, enum: ['business', 'organizer', 'member'], required: true, index: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, default: '', trim: true },
    phone: { type: String, default: '', index: true },
    reviewerName: { type: String, default: '' },
  },
  { timestamps: true }
);

ReviewSchema.index({ targetKind: 1, targetId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', ReviewSchema);
