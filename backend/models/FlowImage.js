const mongoose = require('mongoose');

/**
 * Cloudinary URLs for every image the WhatsApp flow + chatbot needs.
 * See services/flowImages.js for the full key catalog.
 */
const FlowImageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    label: { type: String, default: '' },
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FlowImage', FlowImageSchema);
