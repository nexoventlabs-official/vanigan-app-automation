const mongoose = require('mongoose');

/**
 * A community / event organizer. Same shape as Business so the flow can
 * render either list with a shared template.
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

module.exports = mongoose.model('Organizer', OrganizerSchema);
