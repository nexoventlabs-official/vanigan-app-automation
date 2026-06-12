require('dotenv').config();
const mongoose = require('mongoose');

/**
 * A business listed in the directory. Shown to WhatsApp users after they
 * pick District + Assembly inside the flow.
 *
 * NEW LISTINGS → stored in MEMBER_MONGODB_URI (wati_panel DB).
 * OLD SEED DATA → stays in BUSINESS_MONGODB_URI (vanigan DB, 18k records, untouched).
 *
 * rawSchema is exported so memberDb.js can register the model on the shared
 * MEMBER_MONGODB_URI connection without opening a duplicate connection.
 */
const ServiceSchema = new mongoose.Schema({
  name:          { type: String, default: '' },
  price:         { type: String, default: '' },
  detail:        { type: String, default: '' },
  image:         { type: String, default: '' },
  imagePublicId: { type: String, default: '' },
}, { _id: false });

const BusinessSchema = new mongoose.Schema(
  {
    /* ── Identity ── */
    listingCode:      { type: String, default: '', trim: true },
    name:             { type: String, required: true, trim: true },
    description:      { type: String, default: '' },
    category:         { type: String, default: '', trim: true },
    subCategory:      { type: String, default: '', trim: true },

    /* ── Location ── */
    district:         { type: String, default: '', trim: true, index: true },
    assembly:         { type: String, default: '', trim: true, index: true },
    city:             { type: String, default: '', trim: true },
    pincode:          { type: String, default: '', trim: true },
    address:          { type: String, default: '' },
    landmark:         { type: String, default: '', trim: true },
    serviceLocations: { type: String, default: '' },
    lat:              { type: String, default: '' },
    lng:              { type: String, default: '' },

    /* ── Contact ── */
    phone:            { type: String, default: '', trim: true },
    whatsappNo:       { type: String, default: '', trim: true },
    landline:         { type: String, default: '', trim: true },
    phone2:           { type: String, default: '', trim: true },
    email:            { type: String, default: '', trim: true },
    website:          { type: String, default: '' },

    /* ── Social / Media ── */
    fbLink:           { type: String, default: '' },
    twitterLink:      { type: String, default: '' },
    instaLink:        { type: String, default: '' },
    googleMap:        { type: String, default: '' },
    videoUrl:         { type: String, default: '' },

    /* ── Images ── */
    image:            { type: String, default: '' },
    imagePublicId:    { type: String, default: '' },
    coverImage:       { type: String, default: '' },
    coverImagePublicId: { type: String, default: '' },
    galleryImages:    [{ url: { type: String, default: '' }, publicId: { type: String, default: '' } }],

    /* ── Hours ── */
    openDays:         { type: String, default: '' },
    openTime:         { type: String, default: '' },
    closeTime:        { type: String, default: '' },

    /* ── Services (up to 6) ── */
    services:         { type: [ServiceSchema], default: [] },

    /* ── FAQ ── */
    infoQuestion:     { type: String, default: '' },
    infoAnswer:       { type: String, default: '' },

    /* ── Meta ── */
    listingMode:      { type: String, default: '' },
    slug:             { type: String, default: '' },
    ownerPhone:       { type: String, default: '', trim: true, index: true },
    ownerName:        { type: String, default: '', trim: true },
    ownerPin:         { type: String, default: '' },
    active:           { type: Boolean, default: true },
  },
  { timestamps: true }
);

BusinessSchema.index({ district: 1, assembly: 1, active: 1 });

// Expose schema so memberDb.js can register the model on its shared connection
const rawSchema = BusinessSchema;

// Build the model on MEMBER_MONGODB_URI so new listings land in the member DB.
// Falls back to the default connection if MEMBER_MONGODB_URI is not set.
const MEMBER_URI = process.env.MEMBER_MONGODB_URI;
let BusinessModel;

if (MEMBER_URI) {
  const conn = mongoose.createConnection(MEMBER_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  });
  conn.on('connected', () => console.log('[MemberDB/Business] connected'));
  conn.on('error', (err) => console.error('[MemberDB/Business] error:', err.message));
  BusinessModel = conn.model('Business', BusinessSchema);
} else {
  BusinessModel = mongoose.model('Business', BusinessSchema);
}

BusinessModel.rawSchema = rawSchema;
module.exports = BusinessModel;
