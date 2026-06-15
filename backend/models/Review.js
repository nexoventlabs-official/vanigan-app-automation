const mongoose = require('mongoose');

/**
 * A review/rating posted against a Business, Organizer or Member.
 * `targetKind` discriminates which collection `targetId` points to.
 *
 * Stored on MEMBER_MONGODB_URI so all new reviews land in the member DB.
 * rawSchema is exported so memberDb.js can register the model on its
 * shared connection without opening a duplicate connection.
 */
const ReviewSchema = new mongoose.Schema(
  {
    targetKind: { type: String, enum: ['business', 'organizer', 'member'], required: true, index: true },
    targetId:   { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    rating:     { type: Number, required: true, min: 1, max: 5 },
    text:       { type: String, default: '', trim: true },
    phone:      { type: String, default: '', index: true },
    reviewerName: { type: String, default: '' },
  },
  { timestamps: true }
);

ReviewSchema.index({ targetKind: 1, targetId: 1, createdAt: -1 });
// FIX 8.2: Index to support the sort=rating aggregate path without full collection scan
ReviewSchema.index({ targetKind: 1, rating: -1 });

const rawSchema = ReviewSchema;

const MEMBER_URI = process.env.MEMBER_MONGODB_URI;
let ReviewModel;

if (MEMBER_URI) {
  const conn = mongoose.createConnection(MEMBER_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  });
  conn.on('connected', () => console.log('[MemberDB/Review] connected'));
  conn.on('error', (err) => console.error('[MemberDB/Review] error:', err.message));
  ReviewModel = conn.model('Review', ReviewSchema);
} else {
  ReviewModel = mongoose.model('Review', ReviewSchema);
}

ReviewModel.rawSchema = rawSchema;
module.exports = ReviewModel;
