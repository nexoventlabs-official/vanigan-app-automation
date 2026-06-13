require('dotenv').config();
const mongoose = require('mongoose');

/**
 * A registered Vanigan member (people, not organizations).
 * WhatsApp flow directory listing — shown in the "Members List" screen.
 *
 * Stored on MEMBER_MONGODB_URI alongside Business, Organizer, Review,
 * VaniganMember so all member-related data lives in one DB.
 * rawSchema is exported so memberDb.js can register the model on its
 * shared connection without opening a duplicate connection.
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

const rawSchema = MemberSchema;

const MEMBER_URI = process.env.MEMBER_MONGODB_URI;
let MemberModel;

if (MEMBER_URI) {
  const conn = mongoose.createConnection(MEMBER_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  });
  conn.on('connected', () => console.log('[MemberDB/Member] connected'));
  conn.on('error', (err) => console.error('[MemberDB/Member] error:', err.message));
  MemberModel = conn.model('Member', MemberSchema);
} else {
  MemberModel = mongoose.model('Member', MemberSchema);
}

MemberModel.rawSchema = rawSchema;
module.exports = MemberModel;
