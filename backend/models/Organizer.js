require('dotenv').config();
const mongoose = require('mongoose');

/**
 * A community / event organizer. Same shape as Business so the flow can
 * render either list with a shared template.
 *
 * Stored on MEMBER_MONGODB_URI so organizer status lives alongside member,
 * business, and review data in the same DB.
 * rawSchema is exported so memberDb.js can register the model on its
 * shared connection without opening a duplicate connection.
 */
const OrganizerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    role: { type: String, default: '', trim: true }, // e.g. "Cluster Lead"
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

OrganizerSchema.index({ district: 1, assembly: 1, active: 1 });

const rawSchema = OrganizerSchema;

const MEMBER_URI = process.env.MEMBER_MONGODB_URI;
let OrganizerModel;

if (MEMBER_URI) {
  const conn = mongoose.createConnection(MEMBER_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  });
  conn.on('connected', () => console.log('[MemberDB/Organizer] connected'));
  conn.on('error', (err) => console.error('[MemberDB/Organizer] error:', err.message));
  OrganizerModel = conn.model('Organizer', OrganizerSchema);
} else {
  OrganizerModel = mongoose.model('Organizer', OrganizerSchema);
}

OrganizerModel.rawSchema = rawSchema;
module.exports = OrganizerModel;
