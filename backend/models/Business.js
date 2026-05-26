require('dotenv').config();
const mongoose = require('mongoose');

/**
 * A business listed in the directory. Shown to WhatsApp users after they
 * pick District + Assembly inside the flow.
 * Uses BUSINESS_MONGODB_URI if set, otherwise falls back to the default connection.
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
    active:           { type: Boolean, default: true },
  },
  { timestamps: true }
);

BusinessSchema.index({ district: 1, assembly: 1, active: 1 });

const BUSINESS_URI = process.env.BUSINESS_MONGODB_URI;
if (BUSINESS_URI) {
  const conn = mongoose.createConnection(BUSINESS_URI);
  module.exports = conn.model('Business', BusinessSchema);
} else {
  module.exports = mongoose.model('Business', BusinessSchema);
}
