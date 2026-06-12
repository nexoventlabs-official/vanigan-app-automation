const mongoose = require('mongoose');

/**
 * Vanigan website user — signs up with WhatsApp number + 4-digit PIN.
 * Stores basic profile info collected at signup. If they own a business,
 * businessId links to the Business document.
 *
 * Stored on MEMBER_MONGODB_URI so all user signups land in the member DB.
 * rawSchema is exported so memberDb.js can register the model on its
 * shared connection without opening a duplicate connection.
 */
const VaniganUserSchema = new mongoose.Schema(
  {
    phone:       { type: String, required: true, unique: true, trim: true, index: true },
    name:        { type: String, default: '', trim: true },
    pinHash:     { type: String, required: true },   // bcrypt hash of 4-digit PIN
    district:    { type: String, default: '', trim: true },
    assembly:    { type: String, default: '', trim: true },
    bizName:     { type: String, default: '', trim: true },
    bizCategory: { type: String, default: '', trim: true },
    bizSubCat:   { type: String, default: '', trim: true },
    businessId:  { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

const rawSchema = VaniganUserSchema;

const MEMBER_URI = process.env.MEMBER_MONGODB_URI;
let VaniganUserModel;

if (MEMBER_URI) {
  const conn = mongoose.createConnection(MEMBER_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  });
  conn.on('connected', () => console.log('[MemberDB/VaniganUser] connected'));
  conn.on('error', (err) => console.error('[MemberDB/VaniganUser] error:', err.message));
  VaniganUserModel = conn.model('VaniganUser', VaniganUserSchema);
} else {
  VaniganUserModel = mongoose.model('VaniganUser', VaniganUserSchema);
}

VaniganUserModel.rawSchema = rawSchema;
module.exports = VaniganUserModel;
