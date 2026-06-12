const mongoose = require('mongoose');

/**
 * VaniganMember — registered member who signed up via the user website.
 * Stores full membership profile including EPIC data (if provided),
 * OTP-verified WhatsApp number, photo, blood group, address, and zone info.
 * Membership ID is auto-generated as TNV-XXXXXX.
 */
const VaniganMemberSchema = new mongoose.Schema(
  {
    /* ── Membership ID ── */
    membershipId:  { type: String, trim: true }, // TNV-XXXXXX — unique enforced by schema.index below

    /* ── Authentication ── */
    phone:         { type: String, required: true, unique: true, trim: true, index: true }, // WhatsApp (primary)
    secondaryPhone:{ type: String, default: '', trim: true },                               // from voter DB mobile
    pinHash:       { type: String, required: true },                                         // bcrypt hash of 4-digit PIN

    /* ── Identity (from EPIC or manual) ── */
    name:          { type: String, required: true, trim: true },
    epicNo:        { type: String, default: '', trim: true, uppercase: true },
    hasEpic:       { type: Boolean, default: false },

    /* ── Voter data (populated from voter DB when EPIC provided) ── */
    assemblyName:  { type: String, default: '', trim: true },
    assemblyNo:    { type: String, default: '', trim: true },
    district:      { type: String, default: '', trim: true },
    zone:          { type: String, default: '', trim: true },

    /* ── Personal details ── */
    dob:           { type: String, default: '' },   // "DD/MM/YYYY"
    age:           { type: Number, default: 0 },
    bloodGroup:    { type: String, default: '', trim: true },
    gender:        { type: String, default: '', trim: true },

    /* ── Address ── */
    businessAddress: { type: String, default: '', trim: true },

    /* ── Photo (Cloudinary) ── */
    photoUrl:       { type: String, default: '' },
    photoPublicId:  { type: String, default: '' },

    /* ── Business linkage ── */
    bizName:       { type: String, default: '', trim: true },
    bizCategory:   { type: String, default: '', trim: true },
    bizSubCat:     { type: String, default: '', trim: true },
    businessId:    { type: mongoose.Schema.Types.ObjectId, default: null },

    /* ── Status ── */
    active:        { type: Boolean, default: true },
  },
  { timestamps: true }
);

VaniganMemberSchema.index({ epicNo: 1 }, { sparse: true });
VaniganMemberSchema.index({ membershipId: 1 }, { sparse: true });

// Export both the compiled model (for default connection) AND the raw schema
// so memberDb.js can register it on the dedicated MEMBER_MONGODB_URI connection.
const VaniganMember = mongoose.model('VaniganMember', VaniganMemberSchema);
VaniganMember.rawSchema = VaniganMemberSchema;

module.exports = VaniganMember;